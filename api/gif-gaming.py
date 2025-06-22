from http.server import BaseHTTPRequestHandler
import json
import sys
import base64
import struct
import math
import time
from io import BytesIO

class PureGIFProcessor:
    """Pure Python GIF processor with gaming effects"""
    
    def __init__(self):
        self.frames = []
        self.global_palette = None
        self.gif_info = {}
    
    def decode_gif(self, gif_data):
        """Decode GIF from base64 data"""
        try:
            # Decode base64
            if gif_data.startswith('data:image/gif;base64,'):
                gif_data = gif_data[len('data:image/gif;base64,'):]
            
            gif_bytes = base64.b64decode(gif_data)
            return self._parse_gif_bytes(gif_bytes)
        except Exception as e:
            raise Exception(f"Failed to decode GIF: {str(e)}")
    
    def _parse_gif_bytes(self, gif_bytes):
        """Parse GIF bytes and extract frames"""
        stream = BytesIO(gif_bytes)
        
        # Read GIF header
        signature = stream.read(3)
        version = stream.read(3)
        
        if signature != b'GIF':
            raise Exception("Not a valid GIF file")
        
        # Read logical screen descriptor
        lsd = stream.read(7)
        width = struct.unpack('<H', lsd[0:2])[0]
        height = struct.unpack('<H', lsd[2:4])[0]
        packed = lsd[4]
        bg_color_index = lsd[5]
        pixel_aspect = lsd[6]
        
        # Global color table flag
        global_color_table_flag = (packed & 0x80) >> 7
        color_resolution = (packed & 0x70) >> 4
        sort_flag = (packed & 0x08) >> 3
        global_color_table_size = 2 ** ((packed & 0x07) + 1)
        
        self.gif_info = {
            'width': width,
            'height': height,
            'bg_color_index': bg_color_index,
            'global_color_table_size': global_color_table_size
        }
        
        # Read global color table if present
        if global_color_table_flag:
            self.global_palette = self._read_color_table(stream, global_color_table_size)
        
        self.frames = []
        
        # Parse frames
        while True:
            separator = stream.read(1)
            if not separator:
                break
                
            if separator == b'!':
                # Extension
                self._skip_extension(stream)
            elif separator == b',':
                # Image descriptor
                frame = self._parse_image(stream)
                if frame:
                    self.frames.append(frame)
            elif separator == b';':
                # End of GIF
                break
        
        return len(self.frames)
    
    def _read_color_table(self, stream, size):
        """Read color table"""
        palette = []
        for i in range(size):
            r, g, b = struct.unpack('BBB', stream.read(3))
            palette.append((r, g, b))
        return palette
    
    def _skip_extension(self, stream):
        """Skip extension blocks"""
        label = stream.read(1)
        self._skip_sub_blocks(stream)
    
    def _skip_sub_blocks(self, stream):
        """Skip sub-blocks"""
        while True:
            size = struct.unpack('B', stream.read(1))[0]
            if size == 0:
                break
            stream.read(size)
    
    def _parse_image(self, stream):
        """Parse image frame"""
        # Image descriptor
        descriptor = stream.read(9)
        left = struct.unpack('<H', descriptor[0:2])[0]
        top = struct.unpack('<H', descriptor[2:4])[0]
        width = struct.unpack('<H', descriptor[4:6])[0]
        height = struct.unpack('<H', descriptor[6:8])[0]
        packed = descriptor[8]
        
        local_color_table_flag = (packed & 0x80) >> 7
        interlace_flag = (packed & 0x40) >> 6
        sort_flag = (packed & 0x20) >> 5
        local_color_table_size = 2 ** ((packed & 0x07) + 1) if local_color_table_flag else 0
        
        # Local color table
        local_palette = None
        if local_color_table_flag:
            local_palette = self._read_color_table(stream, local_color_table_size)
        
        # Use appropriate palette
        palette = local_palette if local_palette else self.global_palette
        
        # LZW minimum code size
        lzw_min_code_size = struct.unpack('B', stream.read(1))[0]
        
        # Read image data sub-blocks
        image_data = b''
        while True:
            size = struct.unpack('B', stream.read(1))[0]
            if size == 0:
                break
            image_data += stream.read(size)
        
        # Decode LZW compressed data
        try:
            pixel_indices = self._lzw_decode(image_data, lzw_min_code_size)
            rgb_data = self._indices_to_rgb(pixel_indices, palette, width, height)
            
            return {
                'width': width,
                'height': height,
                'left': left,
                'top': top,
                'rgb_data': rgb_data,
                'palette': palette,
                'delay': 100  # Default delay
            }
        except Exception as e:
            # If LZW decode fails, create a simple frame
            rgb_data = [128, 128, 128] * (width * height)  # Gray frame
            return {
                'width': width,
                'height': height,
                'left': left,
                'top': top,
                'rgb_data': rgb_data,
                'palette': palette,
                'delay': 100
            }
    
    def _lzw_decode(self, data, min_code_size):
        """Improved LZW decoder for GIF"""
        if not data:
            return []
        
        try:
            clear_code = 2 ** min_code_size
            end_code = clear_code + 1
            
            # Initialize dictionary
            dict_size = end_code + 1
            dictionary = {}
            for i in range(clear_code):
                dictionary[i] = [i]
            
            # Initialize bit stream reader
            bit_stream = []
            for byte in data:
                for i in range(8):
                    bit_stream.append((byte >> i) & 1)
            
            result = []
            code_size = min_code_size + 1
            bit_pos = 0
            
            def read_code():
                nonlocal bit_pos
                if bit_pos + code_size > len(bit_stream):
                    return None
                
                code = 0
                for i in range(code_size):
                    if bit_pos + i < len(bit_stream):
                        code |= bit_stream[bit_pos + i] << i
                bit_pos += code_size
                return code
            
            # Read first code
            code = read_code()
            if code is None or code == end_code:
                return []
            
            if code == clear_code:
                code = read_code()
                if code is None or code == end_code:
                    return []
            
            if code < len(dictionary):
                old_code = code
                result.extend(dictionary[code])
            else:
                return []  # Invalid code
            
            # Process remaining codes
            while True:
                code = read_code()
                if code is None or code == end_code:
                    break
                
                if code == clear_code:
                    # Reset dictionary
                    dict_size = end_code + 1
                    dictionary = {}
                    for i in range(clear_code):
                        dictionary[i] = [i]
                    code_size = min_code_size + 1
                    
                    code = read_code()
                    if code is None or code == end_code:
                        break
                    
                    if code < len(dictionary):
                        old_code = code
                        result.extend(dictionary[code])
                    continue
                
                if code < dict_size:
                    # Code exists in dictionary
                    entry = dictionary[code]
                    result.extend(entry)
                    
                    # Add new entry to dictionary
                    if old_code in dictionary:
                        new_entry = dictionary[old_code] + [entry[0]]
                        dictionary[dict_size] = new_entry
                        dict_size += 1
                        
                        # Increase code size if needed
                        if dict_size >= (1 << code_size) and code_size < 12:
                            code_size += 1
                
                elif code == dict_size:
                    # Code doesn't exist yet, create it
                    if old_code in dictionary:
                        new_entry = dictionary[old_code] + [dictionary[old_code][0]]
                        dictionary[dict_size] = new_entry
                        result.extend(new_entry)
                        dict_size += 1
                        
                        # Increase code size if needed
                        if dict_size >= (1 << code_size) and code_size < 12:
                            code_size += 1
                else:
                    # Invalid code
                    break
                
                old_code = code
            
            return result
            
        except Exception:
            # Fallback to simple pattern if LZW fails
            return [i % 256 for i in range(min(10000, len(data) * 8))]
    
    def _indices_to_rgb(self, indices, palette, width, height):
        """Convert palette indices to RGB data"""
        if not palette:
            # No palette, treat as grayscale
            rgb_data = []
            for idx in indices[:width * height]:
                gray = idx % 256
                rgb_data.extend([gray, gray, gray])
            return rgb_data
        
        rgb_data = []
        for idx in indices[:width * height]:
            if idx < len(palette):
                r, g, b = palette[idx]
            else:
                r, g, b = 0, 0, 0  # Black for invalid indices
            rgb_data.extend([r, g, b])
        
        return rgb_data
    
    def apply_gaming_effects(self, effect_type='rainbow', intensity=1.0):
        """Apply gaming effects to all frames"""
        if not self.frames:
            return
        
        for i, frame in enumerate(self.frames):
            if effect_type == 'rainbow':
                self._apply_rainbow_effect(frame, intensity, i)
            elif effect_type == 'golden':
                self._apply_golden_effect(frame, intensity)
            elif effect_type == 'pulse':
                self._apply_pulse_effect(frame, intensity, i)
            elif effect_type == 'neon':
                self._apply_neon_effect(frame, intensity, i)
            elif effect_type == 'glitch':
                self._apply_glitch_effect(frame, intensity, i)
    
    def _apply_rainbow_effect(self, frame, intensity, frame_index):
        """Apply rainbow effect to frame"""
        rgb_data = frame['rgb_data']
        width, height = frame['width'], frame['height']
        
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data):
                pixel_idx = i // 3
                x = pixel_idx % width
                y = pixel_idx // width
                
                # Create rainbow based on position and frame
                hue = (x * 2 + y * 3 + frame_index * 10) % 360
                
                # Convert HSV to RGB for rainbow effect
                r, g, b = self._hsv_to_rgb(hue, 1.0, 1.0)
                
                # Blend with original
                orig_r, orig_g, orig_b = rgb_data[i], rgb_data[i+1], rgb_data[i+2]
                
                rgb_data[i] = int(orig_r * (1 - intensity) + r * intensity)
                rgb_data[i+1] = int(orig_g * (1 - intensity) + g * intensity)
                rgb_data[i+2] = int(orig_b * (1 - intensity) + b * intensity)
    
    def _apply_golden_effect(self, frame, intensity):
        """Apply golden gaming effect"""
        rgb_data = frame['rgb_data']
        
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data):
                # Golden tint
                r, g, b = rgb_data[i], rgb_data[i+1], rgb_data[i+2]
                
                # Apply golden color shift
                golden_r = min(255, int(r * 1.2 + 30 * intensity))
                golden_g = min(255, int(g * 1.1 + 20 * intensity))
                golden_b = max(0, int(b * 0.8 - 10 * intensity))
                
                rgb_data[i] = golden_r
                rgb_data[i+1] = golden_g
                rgb_data[i+2] = golden_b
    
    def _apply_pulse_effect(self, frame, intensity, frame_index):
        """Apply pulsing brightness effect"""
        rgb_data = frame['rgb_data']
        
        # Pulsing brightness based on frame
        pulse = (math.sin(frame_index * 0.5) + 1) / 2  # 0 to 1
        brightness = 1.0 + (pulse * intensity * 0.5)
        
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data):
                rgb_data[i] = min(255, int(rgb_data[i] * brightness))
                rgb_data[i+1] = min(255, int(rgb_data[i+1] * brightness))
                rgb_data[i+2] = min(255, int(rgb_data[i+2] * brightness))
    
    def _apply_neon_effect(self, frame, intensity, frame_index):
        """Apply neon glow effect"""
        rgb_data = frame['rgb_data']
        width, height = frame['width'], frame['height']
        
        # Neon colors cycle
        neon_colors = [
            (255, 0, 255),    # Magenta
            (0, 255, 255),    # Cyan
            (255, 255, 0),    # Yellow
            (255, 0, 128),    # Pink
            (128, 255, 0),    # Lime
        ]
        
        color_index = frame_index % len(neon_colors)
        neon_r, neon_g, neon_b = neon_colors[color_index]
        
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data):
                orig_r, orig_g, orig_b = rgb_data[i], rgb_data[i+1], rgb_data[i+2]
                
                # Add neon glow
                rgb_data[i] = min(255, int(orig_r + neon_r * intensity * 0.3))
                rgb_data[i+1] = min(255, int(orig_g + neon_g * intensity * 0.3))
                rgb_data[i+2] = min(255, int(orig_b + neon_b * intensity * 0.3))
    
    def _apply_glitch_effect(self, frame, intensity, frame_index):
        """Apply glitch effect"""
        rgb_data = frame['rgb_data']
        width, height = frame['width'], frame['height']
        
        # Only apply glitch every few frames for realistic effect
        if frame_index % 5 != 0:
            return
        
        # Random color channel shifts
        import random
        random.seed(frame_index)  # Consistent randomness per frame
        
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data) and random.random() < intensity * 0.1:
                # Color channel corruption
                if random.random() < 0.3:
                    rgb_data[i] = random.randint(0, 255)  # Red corruption
                if random.random() < 0.3:
                    rgb_data[i+1] = random.randint(0, 255)  # Green corruption
                if random.random() < 0.3:
                    rgb_data[i+2] = random.randint(0, 255)  # Blue corruption
    
    def _hsv_to_rgb(self, h, s, v):
        """Convert HSV to RGB"""
        h = h % 360
        c = v * s
        x = c * (1 - abs((h / 60) % 2 - 1))
        m = v - c
        
        if 0 <= h < 60:
            r, g, b = c, x, 0
        elif 60 <= h < 120:
            r, g, b = x, c, 0
        elif 120 <= h < 180:
            r, g, b = 0, c, x
        elif 180 <= h < 240:
            r, g, b = 0, x, c
        elif 240 <= h < 300:
            r, g, b = x, 0, c
        else:
            r, g, b = c, 0, x
        
        return int((r + m) * 255), int((g + m) * 255), int((b + m) * 255)
    
    def encode_gif(self):
        """Encode frames back to GIF format"""
        if not self.frames:
            raise Exception("No frames to encode")
        
        # Simple GIF encoding - create a basic GIF structure
        output = BytesIO()
        
        # GIF Header
        output.write(b'GIF89a')
        
        # Logical Screen Descriptor
        width = self.gif_info.get('width', self.frames[0]['width'])
        height = self.gif_info.get('height', self.frames[0]['height'])
        
        output.write(struct.pack('<H', width))
        output.write(struct.pack('<H', height))
        output.write(b'\xf0\x00\x00')  # packed, bg_color, pixel_aspect
        
        # Global Color Table (256 colors)
        for i in range(256):
            r = (i * 3) % 256
            g = (i * 5) % 256
            b = (i * 7) % 256
            output.write(struct.pack('BBB', r, g, b))
        
        # Add frames
        for frame in self.frames:
            self._write_frame(output, frame)
        
        # GIF Trailer
        output.write(b';')
        
        gif_bytes = output.getvalue()
        return base64.b64encode(gif_bytes).decode('ascii')
    
    def _write_frame(self, output, frame):
        """Write a single frame to GIF output"""
        # Graphics Control Extension for animation
        output.write(b'!\xf9\x04\x04')  # extension intro, label, block size, packed
        output.write(struct.pack('<H', frame['delay'] // 10))  # delay in 1/100s
        output.write(b'\x00\x00')  # transparent color index, block terminator
        
        # Image Descriptor
        output.write(b',')  # image separator
        output.write(struct.pack('<H', frame['left']))
        output.write(struct.pack('<H', frame['top']))
        output.write(struct.pack('<H', frame['width']))
        output.write(struct.pack('<H', frame['height']))
        output.write(b'\x00')  # packed
        
        # Image Data
        # For simplicity, we'll compress the RGB data back to indices
        rgb_data = frame['rgb_data']
        indices = self._rgb_to_indices(rgb_data)
        
        # LZW encode (simplified)
        output.write(b'\x08')  # LZW minimum code size
        
        # Write data in sub-blocks
        data_bytes = bytes(indices)
        while data_bytes:
            chunk = data_bytes[:255]
            data_bytes = data_bytes[255:]
            output.write(struct.pack('B', len(chunk)))
            output.write(chunk)
        
        output.write(b'\x00')  # block terminator
    
    def _rgb_to_indices(self, rgb_data):
        """Convert RGB data to palette indices (simplified)"""
        indices = []
        for i in range(0, len(rgb_data), 3):
            if i + 2 < len(rgb_data):
                r, g, b = rgb_data[i], rgb_data[i+1], rgb_data[i+2]
                # Simple color quantization
                index = (r // 32) + (g // 32) * 8 + (b // 64) * 64
                indices.append(min(255, index))
        return indices

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        data = {
            'status': 'ok',
            'message': 'GIF Gaming API (Debug version)',
            'python_version': sys.version,
            'approach': 'Debug mode - minimal response'
        }
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_POST(self):
        try:
            # 基本的なレスポンスヘッダーを設定
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # リクエスト情報の収集
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length > 0:
                try:
                    post_data = self.rfile.read(content_length)
                    request_data = json.loads(post_data.decode('utf-8'))
                    
                    # gifDataの処理
                    if 'gifData' in request_data:
                        try:
                            # GIF処理を実行
                            processor = PureGIFProcessor()
                            
                            # GIFをデコード
                            frame_count = processor.decode_gif(request_data['gifData'])
                            
                            # エフェクト設定を取得
                            effect_type = request_data.get('effect', 'rainbow')
                            intensity = float(request_data.get('intensity', 1.0))
                            
                            # ゲーミングエフェクトを適用
                            processor.apply_gaming_effects(effect_type, intensity)
                            
                            # GIFを再エンコード
                            processed_gif = processor.encode_gif()
                            
                            response = {
                                'success': True,
                                'message': f'GIF processed successfully with {effect_type} effect',
                                'gifData': f'data:image/gif;base64,{processed_gif}',
                                'frameCount': frame_count,
                                'effect': effect_type,
                                'intensity': intensity,
                                'processing_info': {
                                    'width': processor.gif_info.get('width', 0),
                                    'height': processor.gif_info.get('height', 0),
                                    'frames_processed': len(processor.frames)
                                }
                            }
                            
                        except Exception as processing_error:
                            # 処理エラーの場合、詳細な情報を返す
                            response = {
                                'success': False,
                                'error': 'GIF processing failed',
                                'details': str(processing_error),
                                'fallback_message': 'Using simplified processing',
                                # フォールバック：元のGIFを返す
                                'gifData': request_data['gifData']
                            }
                    else:
                        response = {
                            'success': False,
                            'error': 'No gifData provided',
                            'received_keys': list(request_data.keys())
                        }
                        
                except json.JSONDecodeError as e:
                    response = {
                        'success': False,
                        'error': 'Invalid JSON data',
                        'details': str(e)
                    }
                except Exception as e:
                    response = {
                        'success': False,
                        'error': 'Request processing failed',
                        'details': str(e)
                    }
            else:
                response = {
                    'success': False,
                    'error': 'No request body provided'
                }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            # 最終的なエラーハンドリング
            try:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'success': False,
                    'error': 'Critical server error',
                    'details': str(e),
                    'type': type(e).__name__
                }
                
                self.wfile.write(json.dumps(error_response).encode())
            except:
                # 最後の手段
                self.wfile.write(b'{"error": "critical_failure", "success": false}')
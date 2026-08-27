import argparse
import re
import struct
from pathlib import Path
from PIL import Image


def sanitize_name(name: str) -> str:
    name = re.sub(r'[^0-9a-zA-Z_]', '_', name)
    if not name:
        name = "xcImage"
    if name[0].isdigit():
        name = "_" + name
    return name


def parse_hex_color(s: str):
    s = s.strip().lstrip("#")
    if len(s) != 6:
        raise ValueError("Background color must be RRGGBB, e.g. 000000 or FFFFFF")
    r = int(s[0:2], 16)
    g = int(s[2:4], 16)
    b = int(s[4:6], 16)
    return (r, g, b)


def rgb888_to_rgb565(r: int, g: int, b: int) -> int:
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)

def encode_rle_rgb565(pixels: list[int]) -> bytes:
    """
    XC_GUI RLE format:

    Repeated run:
        uint16 run_length
        uint16 color

    Raw run:
        uint16 0
        uint16 raw_pixel_count
        uint16 pixels[raw_pixel_count]
    """
    output = bytearray()
    pixel_count = len(pixels)
    index = 0

    def get_run_length(start: int) -> int:
        color = pixels[start]
        count = 1

        while (
            start + count < pixel_count
            and pixels[start + count] == color
            and count < 0xFFFF
        ):
            count += 1

        return count

    while index < pixel_count:
        run_length = get_run_length(index)

        # Compress runs of three or more identical pixels.
        if run_length >= 3:
            output += struct.pack("<H", run_length)
            output += struct.pack("<H", pixels[index])
            index += run_length
            continue

        # Store non-repeating pixels as a raw section.
        raw_pixels = []

        while index < pixel_count and len(raw_pixels) < 0xFFFF:
            run_length = get_run_length(index)

            if run_length >= 3:
                break

            for _ in range(run_length):
                if len(raw_pixels) >= 0xFFFF:
                    break

                raw_pixels.append(pixels[index])
                index += 1

        output += struct.pack("<H", 0)
        output += struct.pack("<H", len(raw_pixels))

        for pixel in raw_pixels:
            output += struct.pack("<H", pixel)

    return bytes(output)

def convert_image_to_xcgui_bytes(
    image_path: Path,
    width: int,
    height: int,
    bg_rgb,
    output_format: str
) -> bytes:
    img = Image.open(image_path).convert("RGBA")
    img = img.resize((width, height), Image.Resampling.NEAREST)

    background = Image.new(
        "RGBA",
        img.size,
        (bg_rgb[0], bg_rgb[1], bg_rgb[2], 255)
    )

    img = Image.alpha_composite(background, img).convert("RGB")

    pixels: list[int] = []

    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            pixels.append(rgb888_to_rgb565(r, g, b))

    data = bytearray()

    data += struct.pack("<H", width)
    data += struct.pack("<H", height)

    if output_format == "rle":
        # Format 1: XC_GUI RLE
        data += struct.pack("<H", 1)
        data += encode_rle_rgb565(pixels)
    else:
        # Format 0: raw RGB565
        data += struct.pack("<H", 0)

        for pixel in pixels:
            data += struct.pack("<H", pixel)

    return bytes(data)


def format_hex_for_typescript(data: bytes, bytes_per_line: int = 16) -> str:
    lines = []
    for i in range(0, len(data), bytes_per_line):
        chunk = data[i:i + bytes_per_line]
        lines.append("    " + "".join(f"{b:02x}" for b in chunk))
    return "\n".join(lines)


def generate_ts(var_name: str, data: bytes) -> str:
    hex_body = format_hex_for_typescript(data)

    return f"""namespace XCImages {{
    export const {var_name}: Buffer = hex`
{hex_body}
    `
}}
"""


def main():
    parser = argparse.ArgumentParser(description="Convert PNG/JPG to XC_GUI TypeScript Buffer")
    parser.add_argument("input", help="Input image path (PNG/JPG)")
    parser.add_argument("--width", type=int, default=None, help="Output width (default: source image width)")
    parser.add_argument("--height", type=int, default=None, help="Output height (default: source image height)")
    parser.add_argument("--name", default=None, help="TypeScript variable name (default: output filename stem)")
    parser.add_argument("--bg", default="000000", help="Background color for alpha, RRGGBB (default: 000000)")
    parser.add_argument("--out", default="", help="Output .ts file path")
    parser.add_argument("--format", choices=["raw", "rle"], default="rle", help="XC_GUI bitmap format (default: rle)"
)
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    bg_rgb = parse_hex_color(args.bg)

    with Image.open(input_path) as source_image:
        source_width, source_height = source_image.size

    width = args.width if args.width is not None else source_width
    height = args.height if args.height is not None else source_height

    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be greater than 0")

    data = convert_image_to_xcgui_bytes(
        input_path,
        width,
        height,
        bg_rgb,
        args.format
    )
    print(f"Format: {args.format}")

    if args.out:
        out_path = Path(args.out)
    else:
        out_path = input_path.with_suffix(".ts")

    # If --name is not supplied, derive the Buffer variable name from the
    # output filename. Example: needle_min.ts -> needle_min
    if args.name:
        var_name = sanitize_name(args.name)
    else:
        var_name = sanitize_name(out_path.stem)

    ts_code = generate_ts(var_name, data)
    out_path.write_text(ts_code, encoding="utf-8")

    print("Done.")
    print(f"Input : {input_path}")
    print(f"Output: {out_path}")
    print(f"Source: {source_width}x{source_height}")
    print(f"Size  : {width}x{height}")
    print(f"Bytes : {len(data)}")
    print(f"Name  : {var_name}")


if __name__ == "__main__":
    main()
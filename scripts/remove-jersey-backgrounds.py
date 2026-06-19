from collections import deque
from pathlib import Path

from PIL import Image


PUBLIC_DIR = Path(__file__).resolve().parents[1] / "public"
SOURCE_DIR = PUBLIC_DIR / "jerseys"
OUTPUT_DIR = PUBLIC_DIR / "jerseys-transparent"
BACK_SOURCE_DIR = PUBLIC_DIR / "jerseys-back"
BACK_OUTPUT_DIR = PUBLIC_DIR / "jerseys-back-transparent"


def is_background(pixel, floor):
    red, green, blue, alpha = pixel
    if alpha == 0:
        return True

    maximum = max(red, green, blue)
    minimum = min(red, green, blue)
    return minimum >= floor and maximum - minimum <= 30


def remove_connected_background(image):
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    visited = bytearray(width * height)
    queue = deque()
    corner_pixels = [
        pixels[0, 0],
        pixels[width - 1, 0],
        pixels[0, height - 1],
        pixels[width - 1, height - 1],
    ]
    opaque_corners = [pixel for pixel in corner_pixels if pixel[3] > 0]
    corner_floor = min(
        (min(pixel[:3]) for pixel in opaque_corners),
        default=255,
    )
    background_floor = max(205, corner_floor - 18)

    def enqueue(x, y):
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        if is_background(pixels[x, y], background_floor):
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        red, green, blue, original_alpha = pixels[x, y]
        if original_alpha == 0:
            pixels[x, y] = (red, green, blue, 0)
        else:
            whiteness = min(red, green, blue)
            alpha = max(0, min(255, (background_floor + 10 - whiteness) * 18))
            pixels[x, y] = (red, green, blue, alpha)

        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    return image


def process_directory(source_dir, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)

    for source_path in sorted(source_dir.iterdir()):
        if source_path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue

        output_path = output_dir / f"{source_path.stem}.png"
        if output_path.exists():
            continue

        with Image.open(source_path) as source_image:
            source_image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            result = remove_connected_background(source_image)
            result.save(output_path, "PNG", optimize=True)
        print(f"{source_path.name} -> {output_path.name}")


def main():
    process_directory(SOURCE_DIR, OUTPUT_DIR)
    if BACK_SOURCE_DIR.exists():
        process_directory(BACK_SOURCE_DIR, BACK_OUTPUT_DIR)


if __name__ == "__main__":
    main()

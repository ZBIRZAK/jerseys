import AppKit
import Foundation
import UniformTypeIdentifiers

enum RemoveWhiteBackgroundError: Error {
  case invalidArguments
  case loadFailed(String)
  case cgImageMissing
  case contextCreationFailed
  case destinationCreationFailed
  case writeFailed(String)
}

let arguments = CommandLine.arguments

guard arguments.count >= 2 else {
  throw RemoveWhiteBackgroundError.invalidArguments
}

let inputPath = arguments[1]
let threshold = arguments.count >= 3 ? max(0, min(255, Int(arguments[2]) ?? 245)) : 245
let url = URL(fileURLWithPath: inputPath)

guard let image = NSImage(contentsOf: url) else {
  throw RemoveWhiteBackgroundError.loadFailed(inputPath)
}

var proposedRect = CGRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
  throw RemoveWhiteBackgroundError.cgImageMissing
}

let width = cgImage.width
let height = cgImage.height
let bytesPerPixel = 4
let bytesPerRow = width * bytesPerPixel
let bitsPerComponent = 8

guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
  throw RemoveWhiteBackgroundError.contextCreationFailed
}

guard let context = CGContext(
  data: nil,
  width: width,
  height: height,
  bitsPerComponent: bitsPerComponent,
  bytesPerRow: bytesPerRow,
  space: colorSpace,
  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
) else {
  throw RemoveWhiteBackgroundError.contextCreationFailed
}

context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

guard let data = context.data else {
  throw RemoveWhiteBackgroundError.contextCreationFailed
}

let pixels = data.bindMemory(to: UInt8.self, capacity: width * height * bytesPerPixel)

for y in 0..<height {
  for x in 0..<width {
    let offset = (y * bytesPerRow) + (x * bytesPerPixel)
    let red = Int(pixels[offset])
    let green = Int(pixels[offset + 1])
    let blue = Int(pixels[offset + 2])

    if red >= threshold && green >= threshold && blue >= threshold {
      pixels[offset + 3] = 0
    }
  }
}

guard let outputImage = context.makeImage() else {
  throw RemoveWhiteBackgroundError.contextCreationFailed
}

guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
  throw RemoveWhiteBackgroundError.destinationCreationFailed
}

CGImageDestinationAddImage(destination, outputImage, nil)

if !CGImageDestinationFinalize(destination) {
  throw RemoveWhiteBackgroundError.writeFailed(inputPath)
}

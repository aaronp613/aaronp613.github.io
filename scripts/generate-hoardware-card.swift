// Run from the repository root: swift scripts/generate-hoardware-card.swift
import AppKit

let size = NSSize(width: 1200, height: 630)
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1200, pixelsHigh: 630,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: a)
}
func panel(_ rect: NSRect, _ radius: CGFloat, _ fill: NSColor, border: NSColor? = nil) {
    let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    fill.setFill(); path.fill()
    if let border { border.setStroke(); path.lineWidth = 1; path.stroke() }
}
func gradient(_ rect: NSRect, _ radius: CGFloat, _ a: NSColor, _ b: NSColor, _ angle: CGFloat = -45) {
    NSGradient(starting: a, ending: b)!.draw(in: NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius), angle: angle)
}
func label(_ text: String, _ x: CGFloat, _ y: CGFloat, _ fontSize: CGFloat, _ weight: NSFont.Weight, _ ink: NSColor) {
    (text as NSString).draw(at: NSPoint(x: x, y: y), withAttributes: [.font: NSFont.systemFont(ofSize: fontSize, weight: weight), .foregroundColor: ink, .kern: -fontSize * 0.025])
}
func rotated(_ degrees: CGFloat, x: CGFloat, y: CGFloat, draw: () -> Void) {
    NSGraphicsContext.saveGraphicsState()
    let t = NSAffineTransform(); t.translateX(by: x, yBy: y); t.rotate(byDegrees: degrees); t.concat()
    draw(); NSGraphicsContext.restoreGraphicsState()
}
let white = color(245, 247, 251), muted = color(159, 174, 197)
gradient(NSRect(origin: .zero, size: size), 0, color(11, 15, 25), color(23, 23, 47))
// Subtle blue illumination behind the illustration.
for i in stride(from: 26, through: 1, by: -1) {
    let d = CGFloat(i) * 23
    panel(NSRect(x: 910-d/2, y: 310-d/2, width: d, height: d), d/2, color(90, 123, 230, 0.008))
}
panel(NSRect(x: 24, y: 24, width: 1152, height: 582), 30, .clear, border: color(180, 195, 235, 0.13))
let icon = NSImage(contentsOfFile: "hoardware/icon.png")!
func appIcon(_ rect: NSRect, radius: CGFloat) {
    NSGraphicsContext.saveGraphicsState()
    NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()
    icon.draw(in: rect)
    NSGraphicsContext.restoreGraphicsState()
}
appIcon(NSRect(x: 70, y: 470, width: 62, height: 62), radius: 15)
label("Hoardware", 147, 480, 30, .semibold, white)
label("A home for your", 68, 352, 55, .bold, white)
label("Apple collection.", 68, 285, 55, .bold, color(139, 163, 255))
label("Every device. Every detail. Together.", 71, 229, 22, .regular, muted)
let betaText = "Beta"
let betaWidth = (betaText as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 17, weight: .medium), .kern: -17 * 0.025]).width
let betaPadding: CGFloat = 18
panel(NSRect(x: 71, y: 136, width: betaWidth + betaPadding * 2, height: 39), 19.5, color(86, 132, 230, 0.16), border: color(120, 165, 255, 0.2))
label(betaText, 71 + betaPadding, 145, 17, .medium, color(141, 188, 255))
label("Mac · iPhone · iPad", 71, 98, 16, .medium, muted)
label("aaronperris.com/hoardware", 71, 54, 14, .regular, color(125, 141, 169))
// Same Mac, iPhone, and iPod composition as the page's hero.
for d: CGFloat in [325, 425] {
    panel(NSRect(x: 910-d/2, y: 318-d/2, width: d, height: d), d/2, .clear, border: color(153, 174, 226, 0.12))
}
rotated(9, x: 767, y: 302) {
    panel(NSRect(x: 0, y: 0, width: 278, height: 203), 11, color(147, 180, 205))
    panel(NSRect(x: 0, y: 31, width: 278, height: 172), 11, color(40, 48, 63), border: color(165, 184, 212))
    gradient(NSRect(x: 9, y: 40, width: 260, height: 153), 4, color(98, 194, 235), color(183, 128, 236))
    gradient(NSRect(x: 116, y: -28, width: 46, height: 28), 2, color(159, 191, 213), color(109, 141, 170))
    panel(NSRect(x: 101, y: -32, width: 76, height: 5), 2, color(181, 204, 224))
}
rotated(-12, x: 992, y: 136) {
    panel(NSRect(x: 0, y: 0, width: 99, height: 195), 23, color(160, 169, 190))
    panel(NSRect(x: 3, y: 3, width: 93, height: 189), 21, color(42, 45, 61))
    gradient(NSRect(x: 7, y: 7, width: 85, height: 181), 17, color(114, 88, 191), color(249, 196, 162))
    panel(NSRect(x: 30, y: 169, width: 39, height: 9), 5, color(42, 35, 59))
    let helloSize = ("hello" as NSString).size(withAttributes: [.font: NSFont.systemFont(ofSize: 25, weight: .light), .kern: -25 * 0.025])
    label("hello", 7 + (85 - helloSize.width) / 2, 7 + (181 - helloSize.height) / 2, 25, .light, white)
}
rotated(15, x: 730, y: 153) {
    gradient(NSRect(x: 0, y: 0, width: 100, height: 160), 12, color(252, 253, 255), color(207, 213, 225))
    panel(NSRect(x: 10, y: 87, width: 80, height: 62), 4, color(93, 104, 118))
    panel(NSRect(x: 13, y: 90, width: 74, height: 56), 2, color(194, 208, 195))
    let screenInk = color(49, 63, 67)
    let menuFont = NSFont.monospacedSystemFont(ofSize: 8, weight: .medium)
    func menuText(_ text: String, x: CGFloat, y: CGFloat, ink: NSColor) {
        (text as NSString).draw(at: NSPoint(x: x, y: y), withAttributes: [.font: menuFont, .foregroundColor: ink])
    }
    let titleWidth = ("iPod" as NSString).size(withAttributes: [.font: menuFont]).width
    menuText("iPod", x: 50 - titleWidth / 2, y: 133, ink: screenInk)
    screenInk.withAlphaComponent(0.45).setFill()
    NSRect(x: 15, y: 130, width: 70, height: 0.5).fill()
    panel(NSRect(x: 15, y: 115, width: 70, height: 13), 0, color(88, 122, 151))
    for (index, text) in ["Music", "Extras", "Settings"].enumerated() {
        let y: CGFloat = 117 - CGFloat(index) * 12
        let ink = index == 0 ? white : screenInk
        menuText(text, x: 19, y: y, ink: ink)
        // Draw identical chevrons in a fixed right-hand column.
        let arrow = NSBezierPath()
        arrow.move(to: NSPoint(x: 78, y: y + 2))
        arrow.line(to: NSPoint(x: 81, y: y + 5))
        arrow.line(to: NSPoint(x: 78, y: y + 8))
        arrow.lineWidth = 0.8
        ink.setStroke(); arrow.stroke()
    }
    panel(NSRect(x: 18, y: 12, width: 64, height: 64), 32, .white)
    panel(NSRect(x: 37, y: 31, width: 26, height: 26), 13, color(216, 221, 230))
    let wheelFont = NSFont.systemFont(ofSize: 5, weight: .medium)
    let wheelWidth = ("MENU" as NSString).size(withAttributes: [.font: wheelFont]).width
    ("MENU" as NSString).draw(at: NSPoint(x: 50 - wheelWidth / 2, y: 64), withAttributes: [.font: wheelFont, .foregroundColor: color(125, 136, 152)])
}
rotated(-7, x: 862, y: 270) {
    appIcon(NSRect(x: 0, y: 0, width: 111, height: 111), radius: 26)
}
NSGraphicsContext.restoreGraphicsState()
let png = bitmap.representation(using: .png, properties: [:])!
try png.write(to: URL(fileURLWithPath: "hoardware/social-card.png"))
print("Created hoardware/social-card.png (1200 × 630)")

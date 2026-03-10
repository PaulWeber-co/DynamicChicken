import SwiftUI

struct Constants {
    // Pixel size for the pixel art grid (in-app view)
    // Cat is 14 rows → 14 * 0.8 = 11.2pt height — fits above Dynamic Island
    static let pixelSize: CGFloat = 0.8

    // Pixel size for the Live Activity (tiny, fits in status bar)
    static let liveActivityPixelSize: CGFloat = 1.5

    // Dynamic Island approximate position (iPhone 14 Pro / 15 Pro)
    static let dynamicIslandTopOffset: CGFloat = 11.0
    static let dynamicIslandHeight: CGFloat = 37.0
    static let dynamicIslandWidth: CGFloat = 126.0

    // Cat position: just above the dynamic island
    static let catOffsetAboveIsland: CGFloat = 6.0

    // Colors
    static let catBodyColor = Color(red: 0.95, green: 0.65, blue: 0.25) // Orange tabby
    static let catDarkColor = Color(red: 0.75, green: 0.45, blue: 0.15) // Darker stripes
    static let catLightColor = Color(red: 1.0, green: 0.85, blue: 0.65)  // Light belly
    static let catEyeColor = Color.green
    static let catNoseColor = Color(red: 1.0, green: 0.55, blue: 0.65)
    static let catWhiskerColor = Color.white
    static let backgroundColor = Color(red: 0.08, green: 0.08, blue: 0.12)

    // Animation
    static let animationFrameDuration: TimeInterval = 0.4
    static let actionDuration: TimeInterval = 4.0
}





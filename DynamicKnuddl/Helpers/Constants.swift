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

    // Pet position: just above the dynamic island
    static let catOffsetAboveIsland: CGFloat = 6.0

    // Chicken Colors
    static let chickenBodyColor = Color(red: 1.0, green: 0.84, blue: 0.0)     // Bright yellow
    static let chickenDarkColor = Color(red: 0.85, green: 0.68, blue: 0.0)     // Dark yellow shading
    static let chickenBellyColor = Color(red: 1.0, green: 0.97, blue: 0.85)    // Creamy white belly
    static let chickenBeakColor = Color(red: 1.0, green: 0.55, blue: 0.1)      // Orange beak
    static let chickenCombColor = Color(red: 0.9, green: 0.15, blue: 0.15)     // Red comb

    static let backgroundColor = Color(red: 0.08, green: 0.08, blue: 0.12)

    // Animation
    static let animationFrameDuration: TimeInterval = 0.4
    static let actionDuration: TimeInterval = 4.0
}

import SwiftUI

struct EatingAnimationView: View {
    let visible: Bool
    let opacity: Double

    var body: some View {
        if visible {
            PixelGrid(matrix: CatSprites.fish, pixelSize: Constants.pixelSize)
                .opacity(opacity)
        }
    }
}

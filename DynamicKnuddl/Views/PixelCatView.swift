import SwiftUI

struct PixelCatView: View {
    let sprite: [[Color?]]
    let pixelSize: CGFloat

    init(sprite: [[Color?]], pixelSize: CGFloat = Constants.pixelSize) {
        self.sprite = sprite
        self.pixelSize = pixelSize
    }

    var body: some View {
        PixelGrid(matrix: sprite, pixelSize: pixelSize)
            .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 2)
    }
}

#Preview {
    ZStack {
        Color.black
        PixelCatView(sprite: CatSprites.idle, pixelSize: 6)
    }
}


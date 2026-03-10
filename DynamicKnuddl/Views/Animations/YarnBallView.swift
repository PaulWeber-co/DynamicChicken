import SwiftUI

struct YarnBallView: View {
    let offset: CGFloat
    let visible: Bool

    var body: some View {
        if visible {
            PixelGrid(matrix: ChickenSprites.feather, pixelSize: Constants.pixelSize)
                .offset(y: offset)
        }
    }
}


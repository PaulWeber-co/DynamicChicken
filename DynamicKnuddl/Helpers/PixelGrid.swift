import SwiftUI

/// Renders a 2D pixel matrix as a grid of colored rectangles
struct PixelGrid: View {
    let matrix: [[Color?]]
    let pixelSize: CGFloat

    init(matrix: [[Color?]], pixelSize: CGFloat = Constants.pixelSize) {
        self.matrix = matrix
        self.pixelSize = pixelSize
    }

    var body: some View {
        VStack(spacing: 0) {
            ForEach(0..<matrix.count, id: \.self) { row in
                HStack(spacing: 0) {
                    ForEach(0..<matrix[row].count, id: \.self) { col in
                        if let color = matrix[row][col] {
                            Rectangle()
                                .fill(color)
                                .frame(width: pixelSize, height: pixelSize)
                        } else {
                            Color.clear
                                .frame(width: pixelSize, height: pixelSize)
                        }
                    }
                }
            }
        }
    }
}


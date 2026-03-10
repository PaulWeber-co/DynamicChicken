import SwiftUI

struct SleepingZZZView: View {
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Text("Z")
                    .font(.system(size: CGFloat(4 + index * 1), weight: .bold, design: .monospaced))
                    .foregroundColor(.white.opacity(0.8))
                    .offset(
                        x: CGFloat(index * 3 + 4),
                        y: animate ? CGFloat(-8 - index * 6) : CGFloat(-2)
                    )
                    .opacity(animate ? 0 : 1)
                    .animation(
                        .easeOut(duration: 2.0)
                        .repeatForever(autoreverses: false)
                        .delay(Double(index) * 0.5),
                        value: animate
                    )
            }
        }
        .onAppear {
            animate = true
        }
        .onDisappear {
            animate = false
        }
    }
}




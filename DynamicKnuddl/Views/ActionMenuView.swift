import SwiftUI

struct ActionMenuView: View {
    @ObservedObject var viewModel: PetViewModel

    var body: some View {
        HStack(spacing: 16) {
            MenuButton(icon: "🐟", label: "Füttern") {
                viewModel.feed()
            }
            MenuButton(icon: "💤", label: "Schlafen") {
                viewModel.sleep()
            }
            MenuButton(icon: "🧶", label: "Spielen") {
                viewModel.play()
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
        )
        .transition(.scale(scale: 0.5).combined(with: .opacity))
    }
}

struct MenuButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(icon)
                    .font(.system(size: 28))
                Text(label)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundColor(.white)
            }
            .frame(width: 60, height: 55)
        }
        .buttonStyle(ScaleButtonStyle())
    }
}

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.85 : 1.0)
            .animation(.spring(response: 0.2), value: configuration.isPressed)
    }
}


import SwiftUI

struct ActionMenuView: View {
    @ObservedObject var viewModel: PetViewModel

    var body: some View {
        HStack(spacing: 16) {
            MenuButton(iconName: "leaf.fill", label: "Futtern") {
                viewModel.feed()
            }
            MenuButton(iconName: "moon.zzz.fill", label: "Schlafen") {
                viewModel.sleep()
            }
            MenuButton(iconName: "figure.run", label: "Spielen") {
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
    let iconName: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: iconName)
                    .font(.system(size: 22))
                    .foregroundColor(.white)
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

import SwiftUI

struct DynamicIslandOverlay: View {
    @ObservedObject var viewModel: PetViewModel

    var body: some View {
        GeometryReader { geometry in
            let screenWidth = geometry.size.width
            let safeTop = geometry.safeAreaInsets.top
            let centerX = screenWidth / 2

            // On Dynamic Island iPhones:
            // Physical top = 0
            // Dynamic Island top edge ≈ 11pt from physical top
            // Dynamic Island bottom edge ≈ 48pt from physical top
            // safeTop ≈ 59pt
            //
            // The cat needs to sit in the ~11pt strip ABOVE the DI
            // Cat: 14 rows * 0.8pt = 11.2pt height, 16 cols * 0.8pt = 12.8pt width
            let catPixelSize = Constants.pixelSize
            let catHeight = CGFloat(14) * catPixelSize
            let catWidth = CGFloat(16) * catPixelSize

            // Position: cat sits so its bottom touches the DI top (~11pt from screen top)
            // In the GeometryReader coordinate space (which starts at safeArea top),
            // the physical screen top is at y = -safeTop
            let diTopFromScreenTop: CGFloat = 11.0
            // Cat bottom = diTopFromScreenTop, cat center = diTopFromScreenTop - catHeight/2
            // In GeometryReader coords: y = -safeTop + catCenterFromScreenTop
            let catCenterY = -safeTop + diTopFromScreenTop - catHeight / 2

            // For the menu and other elements, position relative to DI bottom
            let diBotFromScreenTop: CGFloat = 48.0
            let diBotInGeo = -safeTop + diBotFromScreenTop

            ZStack {
                // Background — fills entire screen
                Constants.backgroundColor
                    .ignoresSafeArea()

                // Stars
                StarsView()
                    .ignoresSafeArea()

                // === Cat sitting ON TOP of the Dynamic Island ===
                PixelCatView(sprite: viewModel.currentSprite, pixelSize: catPixelSize)
                    .onTapGesture {
                        viewModel.toggleMenu()
                    }
                    // Make tap target bigger than the tiny cat
                    .contentShape(Rectangle().size(width: 60, height: 40))
                    .position(x: centerX, y: catCenterY)

                // ZZZ for sleeping — floats up from cat
                if viewModel.currentState == .sleeping {
                    SleepingZZZView()
                        .scaleEffect(0.35)
                        .position(x: centerX + catWidth / 2 + 10, y: catCenterY - 6)
                }

                // Fish for eating
                if viewModel.fishVisible {
                    EatingAnimationView(visible: viewModel.fishVisible, opacity: viewModel.fishOpacity)
                        .position(x: centerX - catWidth / 2 - 10, y: catCenterY)
                }

                // Yarn ball — starts near DI, falls down
                if viewModel.yarnBallVisible {
                    YarnBallView(offset: viewModel.yarnBallOffset, visible: viewModel.yarnBallVisible)
                        .position(x: centerX + 5, y: diBotInGeo + 20)
                }

                // Action menu below DI
                if viewModel.showMenu {
                    ActionMenuView(viewModel: viewModel)
                        .position(x: centerX, y: diBotInGeo + 80)
                }

                // State label
                if viewModel.currentState != .idle {
                    Text(viewModel.currentState.displayName)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.6))
                        .position(x: centerX, y: diBotInGeo + 20)
                }

                // Main content area
                VStack(spacing: 20) {
                    Spacer()

                    VStack(spacing: 8) {
                        Text("🐱")
                            .font(.system(size: 50))
                        Text("DynamicKnuddl")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("Dein Pixel-Haustier sitzt oben\nauf der Dynamic Island!")
                            .font(.system(size: 14, design: .rounded))
                            .foregroundColor(.white.opacity(0.5))
                            .multilineTextAlignment(.center)
                    }

                    Spacer()

                    VStack(spacing: 12) {
                        Button(action: {
                            viewModel.toggleLiveActivity()
                        }) {
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(viewModel.isLiveActivityRunning ? Color.green : Color.red)
                                    .frame(width: 8, height: 8)
                                Text(viewModel.isLiveActivityRunning
                                     ? "Live Activity aktiv"
                                     : "Live Activity starten")
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(.ultraThinMaterial)
                            )
                        }

                        Text("Katze bleibt auch bei geschlossener App sichtbar")
                            .font(.system(size: 11, design: .rounded))
                            .foregroundColor(.white.opacity(0.3))
                            .multilineTextAlignment(.center)
                    }

                    Spacer()

                    Text("Tippe auf die Katze oben um zu interagieren")
                        .font(.system(size: 12, design: .rounded))
                        .foregroundColor(.white.opacity(0.3))
                        .padding(.bottom, 30)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.top, 60)
            }
            .ignoresSafeArea()
        }
    }
}

// MARK: - Decorative stars
struct Star: Identifiable {
    let id: Int
    let xFraction: CGFloat
    let yFraction: CGFloat
    let size: CGFloat
    let opacity: Double
}

struct StarsView: View {
    let stars: [Star] = {
        var result: [Star] = []
        for i in 0..<40 {
            let seed = Double(i)
            let xFrac = CGFloat(((seed * 73.0 + 17.0).truncatingRemainder(dividingBy: 100.0)) / 100.0)
            let yFrac = CGFloat(((seed * 47.0 + 31.0).truncatingRemainder(dividingBy: 100.0)) / 100.0)
            let size = CGFloat(1.0 + (seed * 13.0).truncatingRemainder(dividingBy: 3.0))
            let opacity = 0.15 + (seed * 29.0).truncatingRemainder(dividingBy: 40.0) / 100.0
            result.append(Star(id: i, xFraction: xFrac, yFraction: yFrac, size: size, opacity: opacity))
        }
        return result
    }()

    var body: some View {
        GeometryReader { geometry in
            ForEach(stars) { star in
                Circle()
                    .fill(Color.white.opacity(star.opacity))
                    .frame(width: star.size, height: star.size)
                    .position(
                        x: star.xFraction * geometry.size.width,
                        y: star.yFraction * geometry.size.height
                    )
            }
        }
    }
}

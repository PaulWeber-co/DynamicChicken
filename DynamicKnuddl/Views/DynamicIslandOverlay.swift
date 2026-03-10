import SwiftUI

struct DynamicIslandOverlay: View {
    @ObservedObject var viewModel: PetViewModel
    @StateObject private var partnerManager = PartnerManager.shared
    @State private var showPairing = false
    @State private var showMessage = false

    var body: some View {
        // Use a ZStack that covers the ENTIRE screen including status bar area
        ZStack(alignment: .top) {
            // Background — fills entire screen
            Constants.backgroundColor
                .ignoresSafeArea()

            // Stars
            StarsView()
                .ignoresSafeArea()

            // === ABSOLUTE SCREEN LAYOUT ===
            // iPhone 15 Pro physical layout (from very top of screen):
            //   0pt  = physical top edge of screen
            //  ~11pt = top edge of Dynamic Island
            //  ~48pt = bottom edge of Dynamic Island
            //  ~59pt = safe area bottom (where normal content starts)
            //
            // We want the cat in the 0–11pt strip.
            // Cat with pixelSize 0.8: 14*0.8 = 11.2pt tall, 16*0.8 = 12.8pt wide
            // → fits perfectly in that strip!

            // This VStack is aligned to .top of the ZStack,
            // and ignoresSafeArea pushes it to the physical top
            VStack(spacing: 0) {
                // Cat — sits right at the top of the screen, above Dynamic Island
                PixelCatView(sprite: viewModel.currentSprite, pixelSize: Constants.pixelSize)
                    .onTapGesture {
                        viewModel.toggleMenu()
                    }
                    .padding(.top, 0) // Flush with physical screen top

                Spacer()
            }
            .ignoresSafeArea()

            // ZZZ for sleeping — positioned at top right of cat
            if viewModel.currentState == .sleeping {
                VStack {
                    SleepingZZZView()
                        .scaleEffect(0.3)
                        .frame(width: 30, height: 20)
                    Spacer()
                }
                .offset(x: 20, y: 0)
                .ignoresSafeArea()
            }

            // Fish for eating — positioned at top left of cat
            if viewModel.fishVisible {
                VStack {
                    EatingAnimationView(visible: viewModel.fishVisible, opacity: viewModel.fishOpacity)
                        .frame(width: 20, height: 15)
                    Spacer()
                }
                .offset(x: -20, y: 2)
                .ignoresSafeArea()
            }

            // Yarn ball for playing — starts below DI, falls down
            if viewModel.yarnBallVisible {
                VStack {
                    Spacer().frame(height: 55) // Below Dynamic Island
                    YarnBallView(offset: viewModel.yarnBallOffset, visible: viewModel.yarnBallVisible)
                    Spacer()
                }
                .ignoresSafeArea()
            }

            // Action menu — below Dynamic Island
            if viewModel.showMenu {
                VStack {
                    Spacer().frame(height: 70) // Below DI + padding
                    ActionMenuView(viewModel: viewModel)
                    Spacer()
                }
                .ignoresSafeArea()
            }

            // State label
            if viewModel.currentState != .idle {
                VStack {
                    Spacer().frame(height: 55)
                    Text(viewModel.currentState.displayName)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.6))
                    Spacer()
                }
                .ignoresSafeArea()
            }

            // Main content area — below safe area
            VStack(spacing: 20) {
                Spacer()

                VStack(spacing: 8) {
                        PixelCatView(sprite: ChickenSprites.idle1, pixelSize: 4.0)
                        Text("DynamicKnuddl")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("Dein Pixel-Chicken sitzt oben\nauf der Dynamic Island!")
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

                    Text("In der App: Chicken sitzt uber der Dynamic Island\nBei geschlossener App: Chicken lebt in der Dynamic Island")
                        .font(.system(size: 11, design: .rounded))
                        .foregroundColor(.white.opacity(0.3))
                        .multilineTextAlignment(.center)
                }

                // Partner Section
                VStack(spacing: 10) {
                    HStack(spacing: 12) {
                        Button(action: { showPairing = true }) {
                            HStack(spacing: 6) {
                                Image(systemName: "person.2.fill").font(.system(size: 14))
                                Text(partnerManager.isPaired ? partnerManager.partnerName : "Partner verbinden")
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 16).padding(.vertical, 10)
                            .background(RoundedRectangle(cornerRadius: 12).fill(.ultraThinMaterial))
                        }

                        if partnerManager.isPaired {
                            Button(action: { showMessage = true }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "envelope.fill").font(.system(size: 14))
                                    Text("Nachricht")
                                        .font(.system(size: 13, weight: .medium, design: .rounded))
                                }
                                .foregroundColor(.black)
                                .padding(.horizontal, 16).padding(.vertical, 10)
                                .background(RoundedRectangle(cornerRadius: 12).fill(.yellow))
                            }
                        }
                    }

                    if !partnerManager.lastReceivedMessage.isEmpty {
                        Text(partnerManager.lastReceivedMessage)
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundColor(.yellow)
                            .padding(.horizontal, 16).padding(.vertical, 8)
                            .background(RoundedRectangle(cornerRadius: 10).fill(.yellow.opacity(0.1)))
                    }
                }

                Spacer()

                Text("Tippe auf das Chicken oben um zu interagieren")
                    .font(.system(size: 12, design: .rounded))
                    .foregroundColor(.white.opacity(0.3))
                    .padding(.bottom, 30)
            }
            .padding(.top, 80)
        }
        .statusBarHidden(true)
        .sheet(isPresented: $showPairing) { PairingView() }
        .sheet(isPresented: $showMessage) { MessageComposeView() }
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







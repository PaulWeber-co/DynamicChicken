import ActivityKit
import WidgetKit
import SwiftUI

struct PetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PetActivityAttributes.self) { context in
            LockScreenPetView(state: context.state, petName: context.attributes.petName)
                .activityBackgroundTint(.black)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        MiniPixelChickenView(petState: context.state.petState, frame: context.state.frame)
                        HStack(spacing: 6) {
                            Text(context.attributes.petName)
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundColor(.white.opacity(0.7))
                            Text("·")
                                .foregroundColor(.white.opacity(0.3))
                            Text(stateLabel(context.state.petState))
                                .font(.system(size: 11, design: .rounded))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        if let msg = context.state.partnerMessage, !msg.isEmpty {
                            Text(msg)
                                .font(.system(size: 10, design: .rounded))
                                .foregroundColor(.yellow.opacity(0.8))
                                .lineLimit(2)
                        }
                    }
                }
            } compactLeading: {
                PixelGrid(matrix: ChickenSprites.idle1, pixelSize: 1.0)
                    .frame(width: 16, height: 14)
            } compactTrailing: {
                Text(stateLabel(context.state.petState))
                    .font(.system(size: 9, design: .rounded))
                    .foregroundColor(.white.opacity(0.7))
            } minimal: {
                PixelGrid(matrix: ChickenSprites.idle1, pixelSize: 0.8)
                    .frame(width: 13, height: 11)
            }
        }
    }

    private func stateLabel(_ state: String) -> String {
        switch state {
        case "eating": return "Picken"
        case "sleeping": return "Schlafen"
        case "playing": return "Spielen"
        default: return "Chillen"
        }
    }
}

// MARK: - Mini Pixel Chicken for expanded DI
struct MiniPixelChickenView: View {
    let petState: String
    let frame: Int

    var body: some View {
        let state = petStateFromString(petState)
        let frames = ChickenSprites.frames(for: state)
        let safeFrame = frame % frames.count
        let sprite = frames[safeFrame]
        PixelGrid(matrix: sprite, pixelSize: 2.5)
    }

    private func petStateFromString(_ str: String) -> PetState {
        switch str {
        case "eating": return .eating
        case "sleeping": return .sleeping
        case "playing": return .playing
        default: return .idle
        }
    }
}

// MARK: - Lock Screen view
struct LockScreenPetView: View {
    let state: PetActivityAttributes.ContentState
    let petName: String

    var body: some View {
        let petState = petStateFromString(state.petState)
        let frames = ChickenSprites.frames(for: petState)
        let safeFrame = state.frame % frames.count

        HStack(spacing: 12) {
            PixelGrid(matrix: frames[safeFrame], pixelSize: 3.0)

            VStack(alignment: .leading, spacing: 2) {
                Text(petName)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                Text(stateLabel(state.petState))
                    .font(.system(size: 11, design: .rounded))
                    .foregroundColor(.white.opacity(0.7))
                if let msg = state.partnerMessage, !msg.isEmpty {
                    Text(msg)
                        .font(.system(size: 10, design: .rounded))
                        .foregroundColor(.yellow.opacity(0.8))
                        .lineLimit(2)
                }
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func petStateFromString(_ str: String) -> PetState {
        switch str {
        case "eating": return .eating
        case "sleeping": return .sleeping
        case "playing": return .playing
        default: return .idle
        }
    }

    private func stateLabel(_ state: String) -> String {
        switch state {
        case "eating": return "Picken"
        case "sleeping": return "Schlafen"
        case "playing": return "Spielen"
        default: return "Chillen"
        }
    }
}

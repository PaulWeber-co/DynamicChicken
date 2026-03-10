import ActivityKit
import WidgetKit
import SwiftUI

struct PetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PetActivityAttributes.self) { context in
            // Lock Screen / Banner view
            LockScreenPetView(state: context.state)
                .activityBackgroundTint(.black)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    Text(stateEmoji(context.state.catState))
                        .font(.system(size: 20))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(stateLabel(context.state.catState))
                        .font(.system(size: 11, design: .rounded))
                        .foregroundColor(.white.opacity(0.7))
                }
                DynamicIslandExpandedRegion(.center) {
                    MiniPixelCatView(catState: context.state.catState, frame: context.state.frame)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.petName)
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.5))
                }
            } compactLeading: {
                // Compact leading: tiny cat face
                MiniCatFaceView()
            } compactTrailing: {
                // Compact trailing: state emoji
                Text(stateEmoji(context.state.catState))
                    .font(.system(size: 14))
            } minimal: {
                // Minimal: just the cat face
                MiniCatFaceView()
            }
        }
    }

    private func stateEmoji(_ state: String) -> String {
        switch state {
        case "eating": return "🐟"
        case "sleeping": return "💤"
        case "playing": return "🧶"
        default: return "😺"
        }
    }

    private func stateLabel(_ state: String) -> String {
        switch state {
        case "eating": return "Essen"
        case "sleeping": return "Schlafen"
        case "playing": return "Spielen"
        default: return "Chillen"
        }
    }
}

// MARK: - Mini Cat Face (for compact/minimal DI)
struct MiniCatFaceView: View {
    var body: some View {
        Image(systemName: "cat.fill")
            .font(.system(size: 14))
            .foregroundColor(Color(red: 0.95, green: 0.65, blue: 0.25))
    }
}

// MARK: - Mini Pixel Cat for expanded DI
struct MiniPixelCatView: View {
    let catState: String
    let frame: Int

    var body: some View {
        let state = catStateFromString(catState)
        let frames = CatSprites.frames(for: state)
        let safeFrame = frame % frames.count
        let sprite = frames[safeFrame]

        PixelGrid(matrix: sprite, pixelSize: 2.0)
    }

    private func catStateFromString(_ str: String) -> CatState {
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

    var body: some View {
        HStack(spacing: 12) {
            let catState = catStateFromString(state.catState)
            let frames = CatSprites.frames(for: catState)
            let safeFrame = state.frame % frames.count

            PixelGrid(matrix: frames[safeFrame], pixelSize: 2.5)

            VStack(alignment: .leading, spacing: 2) {
                Text("DynamicKnuddl")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                Text(stateLabel(state.catState))
                    .font(.system(size: 11, design: .rounded))
                    .foregroundColor(.white.opacity(0.7))
            }

            Spacer()

            Text(stateEmoji(state.catState))
                .font(.system(size: 24))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func catStateFromString(_ str: String) -> CatState {
        switch str {
        case "eating": return .eating
        case "sleeping": return .sleeping
        case "playing": return .playing
        default: return .idle
        }
    }

    private func stateEmoji(_ state: String) -> String {
        switch state {
        case "eating": return "🐟"
        case "sleeping": return "💤"
        case "playing": return "🧶"
        default: return "😺"
        }
    }

    private func stateLabel(_ state: String) -> String {
        switch state {
        case "eating": return "Essen"
        case "sleeping": return "Schlafen"
        case "playing": return "Spielen"
        default: return "Chillen"
        }
    }
}


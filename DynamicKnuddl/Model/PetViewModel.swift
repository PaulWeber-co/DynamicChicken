import SwiftUI
import Combine

class PetViewModel: ObservableObject {
    @Published var currentState: PetState = .idle
    @Published var currentFrame: Int = 0
    @Published var showMenu: Bool = false
    @Published var yarnBallOffset: CGFloat = 0
    @Published var yarnBallVisible: Bool = false
    @Published var fishVisible: Bool = false
    @Published var fishOpacity: Double = 0
    @Published var isLiveActivityRunning: Bool = false

    private var frameTimer: AnyCancellable?
    private var actionTimer: AnyCancellable?

    init() {
        startFrameAnimation()
        // Auto-start Live Activity
        LiveActivityManager.shared.resumeExistingActivity()
        isLiveActivityRunning = true
    }

    private func startFrameAnimation() {
        frameTimer?.cancel()
        frameTimer = Timer.publish(every: Constants.animationFrameDuration, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                let frames = ChickenSprites.frames(for: self.currentState)
                self.currentFrame = (self.currentFrame + 1) % frames.count
                // Sync to Live Activity
                self.syncLiveActivity()
            }
    }

    private func syncLiveActivity() {
        LiveActivityManager.shared.updateActivity(
            petState: currentState.rawValue,
            frame: currentFrame
        )
    }

    func feed() {
        showMenu = false
        currentState = .eating
        currentFrame = 0
        fishVisible = true

        withAnimation(.easeIn(duration: 0.3)) {
            fishOpacity = 1.0
        }

        startFrameAnimation()

        actionTimer?.cancel()
        actionTimer = Timer.publish(every: Constants.actionDuration, on: .main, in: .common)
            .autoconnect().first()
            .sink { [weak self] _ in
                guard let self = self else { return }
                withAnimation(.easeOut(duration: 0.3)) { self.fishOpacity = 0 }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    self.fishVisible = false
                    self.currentState = .idle
                    self.currentFrame = 0
                    self.startFrameAnimation()
                }
            }
    }

    func sleep() {
        showMenu = false
        currentState = .sleeping
        currentFrame = 0
        startFrameAnimation()

        actionTimer?.cancel()
        actionTimer = Timer.publish(every: 6.0, on: .main, in: .common)
            .autoconnect().first()
            .sink { [weak self] _ in
                guard let self = self else { return }
                self.currentState = .idle
                self.currentFrame = 0
                self.startFrameAnimation()
            }
    }

    func play() {
        showMenu = false
        currentState = .playing
        currentFrame = 0
        yarnBallOffset = 0
        yarnBallVisible = true
        startFrameAnimation()

        actionTimer?.cancel()
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            guard let self = self else { return }
            withAnimation(.interpolatingSpring(stiffness: 20, damping: 3).speed(0.3)) {
                self.yarnBallOffset = UIScreen.main.bounds.height + 100
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self] in
            guard let self = self else { return }
            self.yarnBallVisible = false
            self.yarnBallOffset = 0
            self.currentState = .idle
            self.currentFrame = 0
            self.startFrameAnimation()
        }
    }

    func toggleMenu() {
        if currentState != .idle { return }
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            showMenu.toggle()
        }
    }

    func toggleLiveActivity() {
        if isLiveActivityRunning {
            LiveActivityManager.shared.stopAllActivities()
            isLiveActivityRunning = false
        } else {
            LiveActivityManager.shared.startLiveActivity()
            isLiveActivityRunning = true
        }
    }

    var currentSprite: [[Color?]] {
        let frames = ChickenSprites.frames(for: currentState)
        let safeFrame = currentFrame % frames.count
        return frames[safeFrame]
    }
}

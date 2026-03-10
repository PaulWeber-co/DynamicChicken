import SwiftUI
import Combine
import UserNotifications

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
    private var randomAnimationTimer: AnyCancellable?
    private var messageSyncTimer: AnyCancellable?

    init() {
        startFrameAnimation()
        startRandomAnimations()
        startMessageSync()
        requestNotificationPermission()
        // Auto-start Live Activity
        LiveActivityManager.shared.resumeExistingActivity()
        isLiveActivityRunning = true
    }

    // MARK: - Notification Permission

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            print("Notifications permission: \(granted)")
        }
    }

    // MARK: - Frame Animation

    private func startFrameAnimation() {
        frameTimer?.cancel()
        frameTimer = Timer.publish(every: Constants.animationFrameDuration, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                guard let self = self else { return }
                let frames = ChickenSprites.frames(for: self.currentState)
                self.currentFrame = (self.currentFrame + 1) % frames.count
                self.syncLiveActivity()
            }
    }

    // MARK: - Random Animations

    private func startRandomAnimations() {
        randomAnimationTimer?.cancel()
        // Every 8-20 seconds, maybe trigger a random animation
        scheduleNextRandomAnimation()
    }

    private func scheduleNextRandomAnimation() {
        let delay = Double.random(in: 8...20)
        randomAnimationTimer?.cancel()
        randomAnimationTimer = Timer.publish(every: delay, on: .main, in: .common)
            .autoconnect().first()
            .sink { [weak self] _ in
                guard let self = self else { return }
                if self.currentState == .idle && !self.showMenu {
                    self.playRandomAnimation()
                }
                self.scheduleNextRandomAnimation()
            }
    }

    private func playRandomAnimation() {
        guard let randomState = PetState.randomAnimations.randomElement() else { return }

        currentState = randomState
        currentFrame = 0
        startFrameAnimation()

        let duration: TimeInterval
        switch randomState {
        case .turning: duration = 2.0
        case .pecking: duration = 3.0
        case .stretching: duration = 2.5
        case .sleeping: duration = 4.0
        default: duration = 2.0
        }

        actionTimer?.cancel()
        actionTimer = Timer.publish(every: duration, on: .main, in: .common)
            .autoconnect().first()
            .sink { [weak self] _ in
                guard let self = self else { return }
                self.currentState = .idle
                self.currentFrame = 0
                self.startFrameAnimation()
            }
    }

    // MARK: - Message Sync (check for new messages & show in Live Activity)

    private func startMessageSync() {
        messageSyncTimer?.cancel()
        messageSyncTimer = Timer.publish(every: 3.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.syncPartnerMessage()
            }
    }

    private var lastSyncedMessage: String = ""

    private func syncPartnerMessage() {
        let pm = PartnerManager.shared
        let msg = pm.lastReceivedMessage
        let status = pm.lastReceivedStatus

        // Update Live Activity with partner message
        if !msg.isEmpty || !status.isEmpty {
            let combined = [msg, status.isEmpty ? "" : "(\(status))"]
                .filter { !$0.isEmpty }
                .joined(separator: " ")

            LiveActivityManager.shared.updateActivityWithMessage(
                petState: currentState.rawValue,
                frame: currentFrame,
                partnerMessage: combined
            )

            // Send local notification if message changed
            if msg != lastSyncedMessage && !msg.isEmpty {
                lastSyncedMessage = msg
                sendLocalNotification(title: pm.partnerName.isEmpty ? "Nachricht" : pm.partnerName, body: combined)
            }
        }
    }

    // MARK: - Local Notifications

    private func sendLocalNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.5, repeats: false)
        let request = UNNotificationRequest(
            identifier: "partnerMsg_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Notification error: \(error)")
            }
        }
    }

    // MARK: - Live Activity Sync

    private func syncLiveActivity() {
        let pm = PartnerManager.shared
        let msg = pm.lastReceivedMessage
        let status = pm.lastReceivedStatus
        let combined = [msg, status.isEmpty ? "" : "(\(status))"]
            .filter { !$0.isEmpty }
            .joined(separator: " ")

        if !combined.isEmpty {
            LiveActivityManager.shared.updateActivityWithMessage(
                petState: currentState.rawValue,
                frame: currentFrame,
                partnerMessage: combined
            )
        } else {
            LiveActivityManager.shared.updateActivity(
                petState: currentState.rawValue,
                frame: currentFrame
            )
        }
    }

    // MARK: - User Actions

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

import ActivityKit
import Foundation

/// Manages the Live Activity lifecycle
class LiveActivityManager {
    static let shared = LiveActivityManager()

    private var currentActivity: Activity<PetActivityAttributes>?

    private init() {}

    /// Start the Live Activity so the cat stays visible above the Dynamic Island
    func startLiveActivity() {
        stopAllActivities()

        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = PetActivityAttributes(petName: "Knuddl")
        let initialState = PetActivityAttributes.ContentState(
            petState: "idle",
            frame: 0,
            partnerMessage: nil,
            partnerPetState: nil
        )

        let content = ActivityContent(state: initialState, staleDate: nil)

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            currentActivity = activity
            print("Live Activity gestartet: \(activity.id)")
        } catch {
            print("Fehler beim Starten der Live Activity: \(error)")
        }
    }

    /// Update the Live Activity with new state
    func updateActivity(petState: String, frame: Int) {
        guard let activity = currentActivity else { return }

        let updatedState = PetActivityAttributes.ContentState(
            petState: petState,
            frame: frame,
            partnerMessage: nil,
            partnerPetState: nil
        )
        let content = ActivityContent(state: updatedState, staleDate: nil)

        Task {
            await activity.update(content)
        }
    }

    /// Stop all Live Activities
    func stopAllActivities() {
        Task {
            for activity in Activity<PetActivityAttributes>.activities {
                let state = PetActivityAttributes.ContentState(petState: "idle", frame: 0, partnerMessage: nil, partnerPetState: nil)
                await activity.end(
                    ActivityContent(state: state, staleDate: nil),
                    dismissalPolicy: .immediate
                )
            }
            currentActivity = nil
        }
    }

    /// Resume existing activity if one is running
    func resumeExistingActivity() {
        let activities = Activity<PetActivityAttributes>.activities
        if let existing = activities.first {
            currentActivity = existing
        } else {
            startLiveActivity()
        }
    }
}





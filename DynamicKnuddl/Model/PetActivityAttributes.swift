import ActivityKit
import SwiftUI

/// Attributes for the pet Live Activity
struct PetActivityAttributes: ActivityAttributes {
    /// Dynamic state that updates
    public struct ContentState: Codable, Hashable {
        var petState: String    // "idle", "eating", "sleeping", "playing"
        var frame: Int
        var partnerMessage: String?
        var partnerPetState: String?
    }

    // Fixed data
    var petName: String
}

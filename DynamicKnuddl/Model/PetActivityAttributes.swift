import ActivityKit
import SwiftUI

/// Attributes for the pet Live Activity
struct PetActivityAttributes: ActivityAttributes {
    /// Dynamic state that updates
    public struct ContentState: Codable, Hashable {
        var catState: String // "idle", "eating", "sleeping", "playing"
        var frame: Int
    }

    // Fixed data
    var petName: String
}


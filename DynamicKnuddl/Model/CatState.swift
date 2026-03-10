import SwiftUI

enum PetState: String, CaseIterable, Codable {
    case idle
    case eating
    case sleeping
    case playing
    case turning      // dreht sich um
    case pecking      // pickt am Boden (Gras fressen)
    case stretching   // streckt sich

    var displayName: String {
        switch self {
        case .idle: return "Chillen"
        case .eating: return "Picken"
        case .sleeping: return "Schlafen"
        case .playing: return "Spielen"
        case .turning: return "Umdrehen"
        case .pecking: return "Gras picken"
        case .stretching: return "Strecken"
        }
    }

    /// States that can be triggered randomly while idle
    static var randomAnimations: [PetState] {
        [.turning, .pecking, .stretching, .sleeping]
    }
}

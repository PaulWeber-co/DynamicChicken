import SwiftUI

enum PetState: String, CaseIterable, Codable {
    case idle
    case eating
    case sleeping
    case playing

    var displayName: String {
        switch self {
        case .idle: return "Chillen"
        case .eating: return "Picken"
        case .sleeping: return "Schlafen"
        case .playing: return "Spielen"
        }
    }
}

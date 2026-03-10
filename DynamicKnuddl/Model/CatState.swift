import SwiftUI

enum CatState: String, CaseIterable {
    case idle
    case eating
    case sleeping
    case playing

    var displayName: String {
        switch self {
        case .idle: return "Chillen"
        case .eating: return "Essen"
        case .sleeping: return "Schlafen"
        case .playing: return "Spielen"
        }
    }
}


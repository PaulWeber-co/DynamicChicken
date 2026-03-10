import SwiftUI

/// Pixel art sprite data for the chicken pet in different states
/// Grid: 16 wide x 14 tall
struct ChickenSprites {
    // Color aliases
    private static let Y: Color? = Constants.chickenBodyColor     // Yellow body
    private static let D: Color? = Constants.chickenDarkColor      // Dark yellow shading
    private static let W: Color? = Constants.chickenBellyColor     // White belly
    private static let K: Color? = Constants.chickenBeakColor      // Orange beak
    private static let R: Color? = Constants.chickenCombColor      // Red comb
    private static let E: Color? = Color.black                     // Eyes
    private static let B: Color? = Color.black                     // Outlines
    private static let H: Color? = Color.black                     // Hair strands
    private static let X: Color? = nil                             // Transparent

    // MARK: - Idle Frame 1 (standing, front)
    static let idle1: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Idle Frame 2 (slight head tilt)
    static let idle2: [[Color?]] = [
        [X,X,X,X,X,X,X,H,X,H,X,H,X,X,X,X],
        [X,X,X,X,X,X,X,B,X,B,X,B,X,X,X,X],
        [X,X,X,X,B,B,B,R,B,R,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,E,Y,Y,E,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,X,B,K,B,X,X,B,K,B,X,X,X,X],
    ]

    // MARK: - Eating Frame 1 (beak open)
    static let eating1: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,B,B,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Eating Frame 2 (beak closed, happy eyes)
    static let eating2: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,B,B,Y,Y,Y,Y,B,B,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Sleeping Frame 1 (eyes closed)
    static let sleeping1: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,B,B,B,Y,Y,B,B,B,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X,X],
        [X,X,X,B,D,Y,W,W,W,W,Y,D,B,X,X,X],
        [X,X,X,B,Y,W,W,W,W,W,W,Y,B,X,X,X],
        [X,X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X,X],
        [X,X,X,X,X,B,B,B,B,B,B,X,X,X,X,X],
    ]

    // MARK: - Sleeping Frame 2 (curled up)
    static let sleeping2: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,B,B,Y,Y,B,B,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X,X],
        [X,X,X,B,D,Y,W,W,W,W,Y,D,B,X,X,X],
        [X,X,X,B,Y,W,W,W,W,W,W,Y,B,X,X,X],
        [X,X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X,X],
        [X,X,X,X,X,B,B,B,B,B,B,X,X,X,X,X],
    ]

    // MARK: - Playing Frame 1 (wing up left)
    static let playing1: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,B,D,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [B,D,B,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,B,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Playing Frame 2 (wing up right)
    static let playing2: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,D,B,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,B,D,B],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,B,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Corn sprite (food item) - 6x8
    static let corn: [[Color?]] = {
        let C: Color? = Color(red: 1.0, green: 0.85, blue: 0.0)   // Corn yellow
        let G: Color? = Color(red: 0.4, green: 0.7, blue: 0.2)    // Green leaf
        let B: Color? = Color.black
        let X: Color? = nil
        return [
            [X,X,B,B,X,X],
            [X,B,C,C,B,X],
            [X,B,C,C,B,X],
            [B,C,C,C,C,B],
            [B,C,C,C,C,B],
            [B,C,C,C,C,B],
            [X,B,G,G,B,X],
            [X,X,B,B,X,X],
        ]
    }()

    // MARK: - Feather sprite (play item) - 6x8
    static let feather: [[Color?]] = {
        let F: Color? = Color(red: 0.9, green: 0.3, blue: 0.3)    // Red feather
        let P: Color? = Color(red: 0.95, green: 0.5, blue: 0.4)   // Pink highlight
        let B: Color? = Color.black
        let X: Color? = nil
        return [
            [X,X,X,X,B,X],
            [X,X,X,B,F,B],
            [X,X,B,F,P,B],
            [X,B,F,P,F,B],
            [X,B,F,F,B,X],
            [X,X,B,B,X,X],
            [X,X,B,X,X,X],
            [X,B,X,X,X,X],
        ]
    }()

    /// Returns the appropriate sprite frames for a given state
    static func frames(for state: PetState) -> [[[Color?]]] {
        switch state {
        case .idle:
            return [idle1, idle2]
        case .eating:
            return [eating1, eating2]
        case .sleeping:
            return [sleeping1, sleeping2]
        case .playing:
            return [playing1, playing2]
        case .turning:
            return [turning1, turning2, turning3, turning2]
        case .pecking:
            return [pecking1, pecking2, pecking1, pecking2]
        case .stretching:
            return [stretching1, stretching2, stretching1]
        }
    }

    // MARK: - Turning Frame 1 (facing right)
    static let turning1: [[Color?]] = [
        [X,X,X,X,X,X,X,X,X,H,X,H,X,H,X,X],
        [X,X,X,X,X,X,X,X,X,B,X,B,X,B,X,X],
        [X,X,X,X,X,X,B,B,B,R,B,R,B,B,X,X],
        [X,X,X,X,X,B,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,X,B,Y,Y,Y,E,Y,Y,Y,Y,B,K,X],
        [X,X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,K,K,X],
        [X,X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,X,X,B,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,X,X,B,D,Y,W,W,W,W,Y,D,B,X,X],
        [X,X,X,X,B,Y,W,W,W,W,W,W,Y,B,X,X],
        [X,X,X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,X,X,B,K,B,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Turning Frame 2 (back view)
    static let turning2: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,D,D,D,D,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,D,D,D,D,D,D,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Turning Frame 3 (facing left)
    static let turning3: [[Color?]] = [
        [X,X,H,X,H,X,H,X,X,X,X,X,X,X,X,X],
        [X,X,B,X,B,X,B,X,X,X,X,X,X,X,X,X],
        [X,X,B,B,R,B,R,B,B,X,X,X,X,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,B,X,X,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X,X],
        [X,K,B,Y,Y,Y,Y,E,Y,Y,Y,B,X,X,X,X],
        [X,K,K,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,B,X,X,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X,X,X],
        [X,X,B,D,Y,W,W,W,W,Y,D,B,X,X,X,X],
        [X,X,B,Y,W,W,W,W,W,W,Y,B,X,X,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X,X,X],
        [X,X,X,B,K,B,X,X,B,K,B,X,X,X,X,X],
    ]

    // MARK: - Pecking Frame 1 (head down)
    static let pecking1: [[Color?]] = [
        [X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X],
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,K,K,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Pecking Frame 2 (head very down, beak touching ground)
    static let pecking2: [[Color?]] = [
        [X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X],
        [X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X],
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,B,B,B,B,B,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,R,Y,R,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,E,Y,Y,Y,E,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,K,K,K,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Stretching Frame 1 (wings out)
    static let stretching1: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X],
        [X,X,B,Y,B,B,Y,Y,Y,Y,B,B,Y,B,X,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,B,D,Y,Y,Y,Y,K,K,Y,Y,Y,Y,D,B,X],
        [B,D,B,B,Y,Y,Y,Y,Y,Y,Y,Y,B,B,D,B],
        [X,B,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,B,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X],
    ]

    // MARK: - Stretching Frame 2 (tippy toes, wings up)
    static let stretching2: [[Color?]] = [
        [X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X],
        [X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X],
        [X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,B,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,B,X],
        [B,D,B,Y,B,B,Y,Y,Y,Y,B,B,Y,B,D,B],
        [X,B,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,B,X],
        [X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X],
        [X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X],
        [X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X],
        [X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X],
        [X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X],
        [X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X],
        [X,X,X,X,B,K,B,X,X,B,K,B,X,X,X,X],
    ]
}


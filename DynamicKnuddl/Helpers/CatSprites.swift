import SwiftUI

/// Pixel art sprite data for the cat in different states
struct CatSprites {
    // Color aliases for compact matrix definitions
    private static let O: Color? = Constants.catBodyColor      // Orange body
    private static let D: Color? = Constants.catDarkColor       // Dark stripes
    private static let L: Color? = Constants.catLightColor      // Light belly
    private static let E: Color? = Constants.catEyeColor        // Eyes
    private static let N: Color? = Constants.catNoseColor       // Nose
    private static let W: Color? = Color.white                  // Whiskers / highlights
    private static let B: Color? = Color.black                  // Outlines
    private static let X: Color? = nil                          // Transparent

    // MARK: - Idle Cat (sitting, facing front) - 16x14 grid
    static let idle: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,E,O,O,O,O,O,O,O,O,E,O,O,B],
        [B,O,O,O,O,O,O,N,O,O,O,O,O,O,O,B],
        [B,O,O,O,O,O,O,O,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,D,O,O,O,O,D,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,X],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,X,X],
    ]

    // MARK: - Idle Cat Frame 2 (slight tail wag)
    static let idle2: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,E,O,O,O,O,O,O,O,O,E,O,O,B],
        [B,O,O,O,O,O,O,N,O,O,O,O,O,O,O,B],
        [B,O,O,O,O,O,O,O,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,D,O,O,O,O,D,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,B],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,B,O],
    ]

    // MARK: - Eating Frame 1 (mouth open)
    static let eating1: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,E,O,O,O,O,O,O,O,O,E,O,O,B],
        [B,O,O,O,O,O,O,N,O,O,O,O,O,O,O,B],
        [B,O,O,O,O,O,B,B,B,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,B,N,B,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,B,B,B,O,O,O,O,B,X,X],
        [X,X,B,O,O,D,O,O,O,O,D,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,X],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,X,X],
    ]

    // MARK: - Eating Frame 2 (mouth closed, happy)
    static let eating2: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,B,O,O,O,O,O,O,O,O,B,O,O,B],
        [B,O,B,O,B,O,O,N,O,O,O,B,O,B,O,B],
        [B,O,O,O,O,O,O,O,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,W,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,D,O,O,O,O,D,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,X],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,X,X],
    ]

    // MARK: - Sleeping Frame 1 (eyes closed)
    static let sleeping1: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,B,O,O,O,O,O,O,O,O,B,O,O,B],
        [B,O,B,B,B,O,O,N,O,O,O,B,B,B,O,B],
        [B,O,O,O,O,O,O,O,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,X,B,O,O,L,L,L,L,O,O,B,X,X,X],
        [X,X,X,B,O,O,L,L,L,L,O,O,B,X,X,X],
        [X,X,X,B,B,O,O,O,O,O,O,B,B,X,X,X],
        [X,X,X,X,B,B,B,B,B,B,B,B,X,X,X,X],
    ]

    // MARK: - Sleeping Frame 2 (curled up more)
    static let sleeping2: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,B,B,O,O,O,O,O,O,O,O,B,B,O,B],
        [B,O,O,B,B,O,O,N,O,O,O,B,B,O,O,B],
        [B,O,O,O,O,O,O,O,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,X,B,O,O,L,L,L,L,O,O,B,X,X,X],
        [X,X,X,B,O,O,L,L,L,L,O,O,B,X,X,X],
        [X,X,X,B,B,O,O,O,O,O,O,B,B,X,X,X],
        [X,X,X,X,B,B,B,B,B,B,B,B,X,X,X,X],
    ]

    // MARK: - Playing Frame 1 (paw up)
    static let playing1: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,E,O,O,O,O,O,O,O,O,E,O,O,B],
        [B,O,O,O,O,O,O,N,O,O,O,O,O,O,O,B],
        [B,O,O,O,O,O,O,W,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,B,O,B,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,B,B,O,B,D,O,O,O,O,D,O,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,X],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,X,X],
    ]

    // MARK: - Playing Frame 2 (other paw up)
    static let playing2: [[Color?]] = [
        [X,X,B,B,X,X,X,X,X,X,X,X,B,B,X,X],
        [X,B,O,O,B,X,X,X,X,X,X,B,O,O,B,X],
        [B,O,O,O,O,B,B,B,B,B,B,O,O,O,O,B],
        [B,O,O,E,O,O,O,O,O,O,O,O,E,O,O,B],
        [B,O,O,O,O,O,O,N,O,O,O,O,O,O,O,B],
        [B,O,O,O,O,O,O,W,O,O,O,O,O,O,O,B],
        [X,B,O,O,O,O,O,O,O,O,O,O,O,O,B,X],
        [X,X,B,O,O,O,O,O,O,O,O,O,B,O,B,X],
        [X,X,B,O,O,D,O,O,O,O,D,B,O,B,X,X],
        [X,X,B,O,O,O,O,L,L,O,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,O,O,O,L,L,L,L,O,O,O,B,X,X],
        [X,X,B,B,O,O,O,O,O,O,O,O,B,B,X,X],
        [X,X,X,B,B,B,B,B,B,B,B,B,B,X,X,X],
    ]

    // MARK: - Fish sprite for eating animation - 8x5
    static let fish: [[Color?]] = {
        let F: Color? = Color(red: 0.4, green: 0.7, blue: 0.9)
        let T: Color? = Color(red: 0.3, green: 0.6, blue: 0.8)
        let B: Color? = Color.black
        let X: Color? = nil
        return [
            [X,X,X,B,B,B,X,X],
            [T,B,B,F,F,F,B,X],
            [T,T,B,F,B,F,F,B],
            [T,B,B,F,F,F,B,X],
            [X,X,X,B,B,B,X,X],
        ]
    }()

    // MARK: - Yarn ball sprite - 6x6
    static let yarnBall: [[Color?]] = {
        let Y: Color? = Color(red: 0.9, green: 0.3, blue: 0.4)
        let P: Color? = Color(red: 0.8, green: 0.2, blue: 0.5)
        let B: Color? = Color.black
        let X: Color? = nil
        return [
            [X,B,B,B,B,X],
            [B,Y,P,Y,P,B],
            [B,P,Y,P,Y,B],
            [B,Y,P,Y,P,B],
            [B,P,Y,P,Y,B],
            [X,B,B,B,B,X],
        ]
    }()

    /// Returns the appropriate sprite frames for a given state
    static func frames(for state: CatState) -> [[[Color?]]] {
        switch state {
        case .idle:
            return [idle, idle2]
        case .eating:
            return [eating1, eating2]
        case .sleeping:
            return [sleeping1, sleeping2]
        case .playing:
            return [playing1, playing2]
        }
    }
}

import WidgetKit
import SwiftUI

struct PetWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> PetWidgetEntry {
        PetWidgetEntry(date: Date(), petState: .idle, frame: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (PetWidgetEntry) -> Void) {
        completion(PetWidgetEntry(date: Date(), petState: .idle, frame: 0))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PetWidgetEntry>) -> Void) {
        var entries: [PetWidgetEntry] = []
        let now = Date()

        for i in 0..<60 {
            let date = Calendar.current.date(byAdding: .second, value: i * 2, to: now)!
            entries.append(PetWidgetEntry(date: date, petState: .idle, frame: i % 2))
        }

        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct PetWidgetEntry: TimelineEntry {
    let date: Date
    let petState: PetState
    let frame: Int
}

struct PetHomeWidget: Widget {
    let kind: String = "PetHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PetWidgetProvider()) { entry in
            PetWidgetView(entry: entry)
        }
        .configurationDisplayName("DynamicKnuddl")
        .description("Dein Pixel-Chicken auf dem Home Screen")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct PetWidgetView: View {
    let entry: PetWidgetEntry

    var body: some View {
        let frames = ChickenSprites.frames(for: entry.petState)
        let safeFrame = entry.frame % frames.count
        let sprite = frames[safeFrame]

        ZStack {
            Color(red: 0.08, green: 0.08, blue: 0.12)

            VStack(spacing: 6) {
                PixelGrid(matrix: sprite, pixelSize: 4.0)

                Text("Knuddl")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.6))

                Text(entry.petState.displayName)
                    .font(.system(size: 9, design: .rounded))
                    .foregroundColor(.white.opacity(0.4))
            }
        }
    }
}

import SwiftUI

struct MessageComposeView: View {
    @ObservedObject var partnerManager = PartnerManager.shared
    @State private var messageText = ""
    @State private var selectedState: PetState? = nil
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Constants.backgroundColor.ignoresSafeArea()
                VStack(spacing: 20) {
                    Text("Nachricht an \(partnerManager.partnerName)")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundColor(.white)
                    TextField("Kurze Nachricht...", text: $messageText)
                        .textFieldStyle(.roundedBorder)
                        .frame(maxWidth: 300)
                    Text("Chicken-Status setzen (optional)")
                        .font(.system(size: 12, design: .rounded))
                        .foregroundColor(.white.opacity(0.4))
                    HStack(spacing: 12) {
                        ForEach(PetState.allCases, id: \.self) { state in
                            Button(action: { selectedState = (selectedState == state) ? nil : state }) {
                                VStack(spacing: 2) {
                                    Image(systemName: iconFor(state)).font(.system(size: 18))
                                    Text(state.displayName).font(.system(size: 9, design: .rounded))
                                }
                                .foregroundColor(selectedState == state ? .yellow : .white.opacity(0.5))
                                .frame(width: 55, height: 45)
                                .background(RoundedRectangle(cornerRadius: 10).fill(selectedState == state ? .yellow.opacity(0.15) : .white.opacity(0.05)))
                            }
                        }
                    }
                    Button(action: { partnerManager.sendMessage(messageText, petState: selectedState); dismiss() }) {
                        Text("Senden").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundColor(.black).padding(.horizontal, 40).padding(.vertical, 10).background(RoundedRectangle(cornerRadius: 12).fill(.yellow))
                    }.disabled(messageText.isEmpty && selectedState == nil)
                    if !partnerManager.lastReceivedMessage.isEmpty {
                        Divider().background(.white.opacity(0.1))
                        VStack(spacing: 4) {
                            Text("Letzte Nachricht:").font(.system(size: 11, design: .rounded)).foregroundColor(.white.opacity(0.4))
                            Text(partnerManager.lastReceivedMessage).font(.system(size: 14, weight: .medium, design: .rounded)).foregroundColor(.yellow)
                        }
                    }
                    Spacer()
                }.padding(.top, 30).padding(.horizontal, 20)
            }
            .navigationTitle("Nachricht").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .navigationBarTrailing) { Button("Fertig") { dismiss() }.foregroundColor(.yellow) } }
        }
    }

    func iconFor(_ state: PetState) -> String {
        switch state {
        case .idle: return "sun.max.fill"
        case .eating: return "leaf.fill"
        case .sleeping: return "moon.zzz.fill"
        case .playing: return "figure.run"
        }
    }
}


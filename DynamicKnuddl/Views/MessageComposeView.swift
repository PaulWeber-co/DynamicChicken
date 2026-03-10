import SwiftUI

struct MessageComposeView: View {
    @ObservedObject var partnerManager = PartnerManager.shared
    @State private var messageText = ""
    @State private var statusText = ""
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

                    TextField("z.B. schlaeft, spielt, vermisst dich...", text: $statusText)
                        .textFieldStyle(.roundedBorder)
                        .frame(maxWidth: 300)

                    Button(action: {
                        partnerManager.sendMessage(messageText, status: statusText)
                        dismiss()
                    }) {
                        Text("Senden")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundColor(.black)
                            .padding(.horizontal, 40).padding(.vertical, 10)
                            .background(RoundedRectangle(cornerRadius: 12).fill(.yellow))
                    }
                    .disabled(messageText.isEmpty && statusText.isEmpty)

                    if !partnerManager.lastReceivedMessage.isEmpty || !partnerManager.lastReceivedStatus.isEmpty {
                        Divider().background(.white.opacity(0.1))
                        VStack(spacing: 4) {
                            Text("Letzte Nachricht:").font(.system(size: 11, design: .rounded)).foregroundColor(.white.opacity(0.4))
                            if !partnerManager.lastReceivedMessage.isEmpty {
                                Text(partnerManager.lastReceivedMessage)
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundColor(.yellow)
                            }
                            if !partnerManager.lastReceivedStatus.isEmpty {
                                Text("Status: \(partnerManager.lastReceivedStatus)")
                                    .font(.system(size: 12, design: .rounded))
                                    .foregroundColor(.yellow.opacity(0.6))
                            }
                        }
                    }
                    Spacer()
                }.padding(.top, 30).padding(.horizontal, 20)
            }
            .navigationTitle("Nachricht").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .navigationBarTrailing) { Button("Fertig") { dismiss() }.foregroundColor(.yellow) } }
        }
    }
}

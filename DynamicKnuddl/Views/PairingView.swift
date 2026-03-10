import SwiftUI

struct PairingView: View {
    @ObservedObject var partnerManager = PartnerManager.shared
    @State private var inputCode = ""
    @State private var inputName = ""
    @State private var myName = ""
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Constants.backgroundColor.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 24) {
                        // Connection Status
                        HStack(spacing: 8) {
                            Circle()
                                .fill(statusColor)
                                .frame(width: 8, height: 8)
                            Text("Firebase: \(partnerManager.connectionStatus.rawValue)")
                                .font(.system(size: 12, design: .rounded))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        .onAppear {
                            partnerManager.checkFirebaseConnection()
                            myName = partnerManager.getMyName()
                        }

                        if let error = partnerManager.lastError {
                            Text(error)
                                .font(.system(size: 11, design: .rounded))
                                .foregroundColor(.red.opacity(0.8))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }

                        // My name
                        VStack(spacing: 8) {
                            Text("Dein Name").font(.system(size: 14, design: .rounded)).foregroundColor(.white.opacity(0.5))
                            TextField("Dein Name eingeben...", text: $myName)
                                .textFieldStyle(.roundedBorder)
                                .frame(maxWidth: 250)
                                .onChange(of: myName) { newValue in
                                    partnerManager.setMyName(newValue)
                                }
                        }

                        // My code
                        VStack(spacing: 8) {
                            Text("Dein Code").font(.system(size: 14, design: .rounded)).foregroundColor(.white.opacity(0.5))
                            Text(partnerManager.myCode).font(.system(size: 36, weight: .bold, design: .monospaced)).foregroundColor(.yellow).kerning(6)
                            Text("Teile diesen Code mit deinem Partner").font(.system(size: 11, design: .rounded)).foregroundColor(.white.opacity(0.3))
                        }.padding().background(RoundedRectangle(cornerRadius: 16).fill(.white.opacity(0.05)))

                        // Partner pairing
                        VStack(spacing: 12) {
                            Text("Partner verbinden").font(.system(size: 14, weight: .medium, design: .rounded)).foregroundColor(.white.opacity(0.7))
                            TextField("Partner-Name", text: $inputName).textFieldStyle(.roundedBorder).frame(maxWidth: 250)
                            TextField("Partner-Code eingeben", text: $inputCode).textFieldStyle(.roundedBorder).textInputAutocapitalization(.characters).font(.system(size: 20, design: .monospaced)).frame(maxWidth: 250).multilineTextAlignment(.center)
                            Button(action: {
                                if inputCode.count == 6 && !inputName.isEmpty {
                                    partnerManager.pairWith(code: inputCode, name: inputName)
                                    dismiss()
                                }
                            }) {
                                Text("Verbinden").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundColor(.black).padding(.horizontal, 32).padding(.vertical, 10).background(RoundedRectangle(cornerRadius: 12).fill(inputCode.count == 6 && !inputName.isEmpty ? .yellow : .gray))
                            }.disabled(inputCode.count != 6 || inputName.isEmpty)
                        }

                        if partnerManager.isPaired {
                            VStack(spacing: 8) {
                                HStack(spacing: 6) {
                                    Circle().fill(.green).frame(width: 8, height: 8)
                                    Text("Verbunden mit \(partnerManager.partnerName)").font(.system(size: 13, design: .rounded)).foregroundColor(.white.opacity(0.7))
                                }
                                Button("Trennen") { partnerManager.unpair() }.font(.system(size: 12)).foregroundColor(.red.opacity(0.8))
                            }
                        }

                        // MARK: - Test Section
                        VStack(spacing: 12) {
                            Divider().background(.white.opacity(0.1))

                            Text("Testen").font(.system(size: 14, weight: .medium, design: .rounded)).foregroundColor(.white.opacity(0.5))

                            // Local test
                            Button(action: {
                                partnerManager.simulateReceivedMessage(
                                    text: "Hallo, ich vermisse dich!",
                                    status: "denkt an dich"
                                )
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "play.circle.fill").font(.system(size: 14))
                                    Text("Lokal testen (ohne Internet)")
                                        .font(.system(size: 13, weight: .medium, design: .rounded))
                                }
                                .foregroundColor(.white)
                                .padding(.horizontal, 20).padding(.vertical, 10)
                                .background(RoundedRectangle(cornerRadius: 12).fill(.white.opacity(0.1)))
                            }

                            // Firebase roundtrip test
                            Button(action: {
                                partnerManager.testFirebaseRoundtrip()
                            }) {
                                HStack(spacing: 6) {
                                    if partnerManager.isSending {
                                        ProgressView().scaleEffect(0.7).tint(.white)
                                    } else {
                                        Image(systemName: "flame.fill").font(.system(size: 14))
                                    }
                                    Text("Firebase testen (mit Internet)")
                                        .font(.system(size: 13, weight: .medium, design: .rounded))
                                }
                                .foregroundColor(.black)
                                .padding(.horizontal, 20).padding(.vertical, 10)
                                .background(RoundedRectangle(cornerRadius: 12).fill(.yellow))
                            }
                            .disabled(partnerManager.isSending)

                            Text("Sendet eine Test-Nachricht an dich selbst.\nWenn sie erscheint, funktioniert Firebase.")
                                .font(.system(size: 10, design: .rounded))
                                .foregroundColor(.white.opacity(0.3))
                                .multilineTextAlignment(.center)

                            if !partnerManager.lastReceivedMessage.isEmpty || !partnerManager.lastReceivedStatus.isEmpty {
                                VStack(spacing: 4) {
                                    Text("Letzte empfangene Nachricht:")
                                        .font(.system(size: 11, design: .rounded))
                                        .foregroundColor(.white.opacity(0.4))
                                    if !partnerManager.lastReceivedMessage.isEmpty {
                                        Text(partnerManager.lastReceivedMessage)
                                            .font(.system(size: 14, weight: .medium, design: .rounded))
                                            .foregroundColor(.yellow)
                                    }
                                    if !partnerManager.lastReceivedStatus.isEmpty {
                                        Text("Status: \(partnerManager.lastReceivedStatus)")
                                            .font(.system(size: 11, design: .rounded))
                                            .foregroundColor(.yellow.opacity(0.6))
                                    }
                                }
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 12).fill(.yellow.opacity(0.08)))
                            }
                        }

                        Spacer().frame(height: 30)
                    }.padding(.top, 30).padding(.horizontal, 20)
                }
            }.navigationTitle("Partner").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .navigationBarTrailing) { Button("Fertig") { dismiss() }.foregroundColor(.yellow) } }
        }
    }

    private var statusColor: Color {
        switch partnerManager.connectionStatus {
        case .connected: return .green
        case .checking: return .orange
        case .error, .offline: return .red
        case .unknown: return .gray
        }
    }
}

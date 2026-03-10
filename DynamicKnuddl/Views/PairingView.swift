import SwiftUI

struct PairingView: View {
    @ObservedObject var partnerManager = PartnerManager.shared
    @State private var inputCode = ""
    @State private var inputName = ""
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Constants.backgroundColor.ignoresSafeArea()
                VStack(spacing: 24) {
                    VStack(spacing: 8) {
                        Text("Dein Code").font(.system(size: 14, design: .rounded)).foregroundColor(.white.opacity(0.5))
                        Text(partnerManager.myCode).font(.system(size: 36, weight: .bold, design: .monospaced)).foregroundColor(.yellow).kerning(6)
                        Text("Teile diesen Code mit deinem Partner").font(.system(size: 11, design: .rounded)).foregroundColor(.white.opacity(0.3))
                    }.padding().background(RoundedRectangle(cornerRadius: 16).fill(.white.opacity(0.05)))

                    VStack(spacing: 12) {
                        Text("Partner verbinden").font(.system(size: 14, weight: .medium, design: .rounded)).foregroundColor(.white.opacity(0.7))
                        TextField("Name", text: $inputName).textFieldStyle(.roundedBorder).frame(maxWidth: 250)
                        TextField("Code eingeben", text: $inputCode).textFieldStyle(.roundedBorder).textInputAutocapitalization(.characters).font(.system(size: 20, design: .monospaced)).frame(maxWidth: 250).multilineTextAlignment(.center)
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
                    Spacer()
                }.padding(.top, 30).padding(.horizontal, 20)
            }.navigationTitle("Partner").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .navigationBarTrailing) { Button("Fertig") { dismiss() }.foregroundColor(.yellow) } }
        }
    }
}


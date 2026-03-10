import Foundation

/// Partner messaging using local storage (UserDefaults)
/// Without a paid Apple Developer account, CloudKit/Push are not available.
/// This version stores messages locally. For real cross-device messaging,
/// a backend server (e.g. Firebase) would be needed.
class PartnerManager: ObservableObject {
    static let shared = PartnerManager()

    @Published var myCode: String = ""
    @Published var partnerCode: String = ""
    @Published var isPaired: Bool = false
    @Published var lastReceivedMessage: String = ""
    @Published var lastReceivedStatus: String = ""
    @Published var partnerName: String = ""

    private let defaults = UserDefaults.standard

    private let myIDKey = "myPartnerID"
    private let partnerIDKey = "partnerID"
    private let partnerNameKey = "partnerName"
    private let lastReceivedMsgKey = "lastReceivedMsg"
    private let lastReceivedStatusKey = "lastReceivedStatus"

    private init() {
        // Generate or load my unique code
        if let existing = defaults.string(forKey: myIDKey) {
            myCode = existing
        } else {
            let code = generateCode()
            defaults.set(code, forKey: myIDKey)
            myCode = code
        }

        // Load partner info
        if let pid = defaults.string(forKey: partnerIDKey) {
            partnerCode = pid
            isPaired = true
            partnerName = defaults.string(forKey: partnerNameKey) ?? "Partner"
        }

        // Load cached messages
        if let msg = defaults.string(forKey: lastReceivedMsgKey), !msg.isEmpty {
            lastReceivedMessage = msg
        }
        if let status = defaults.string(forKey: lastReceivedStatusKey), !status.isEmpty {
            lastReceivedStatus = status
        }
    }

    // MARK: - Pairing

    func pairWith(code: String, name: String) {
        partnerCode = code.uppercased()
        partnerName = name
        isPaired = true
        defaults.set(partnerCode, forKey: partnerIDKey)
        defaults.set(partnerName, forKey: partnerNameKey)
    }

    func unpair() {
        partnerCode = ""
        partnerName = ""
        isPaired = false
        lastReceivedMessage = ""
        lastReceivedStatus = ""
        defaults.removeObject(forKey: partnerIDKey)
        defaults.removeObject(forKey: partnerNameKey)
        defaults.removeObject(forKey: lastReceivedMsgKey)
        defaults.removeObject(forKey: lastReceivedStatusKey)
    }

    // MARK: - Messaging (local only)

    func sendMessage(_ text: String, status: String = "") {
        guard isPaired else { return }
        // Store locally as "sent" message
        let msg = String(text.prefix(80))
        defaults.set(msg, forKey: "sentMsg_\(partnerCode)")
        if !status.isEmpty {
            defaults.set(status, forKey: "sentStatus_\(partnerCode)")
        }
        print("Message stored locally for \(partnerCode): \(msg) | Status: \(status)")
    }

    // MARK: - Testing

    /// Simulate receiving a message locally
    func simulateReceivedMessage(text: String = "Test Nachricht!", status: String = "schlaeft gerade") {
        DispatchQueue.main.async {
            self.lastReceivedMessage = text
            self.lastReceivedStatus = status
            self.defaults.set(text, forKey: self.lastReceivedMsgKey)
            self.defaults.set(status, forKey: self.lastReceivedStatusKey)
        }
    }

    func clearReceivedMessage() {
        lastReceivedMessage = ""
        lastReceivedStatus = ""
        defaults.removeObject(forKey: lastReceivedMsgKey)
        defaults.removeObject(forKey: lastReceivedStatusKey)
    }

    // MARK: - Helpers

    private func generateCode() -> String {
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return String((0..<6).map { _ in chars.randomElement()! })
    }
}

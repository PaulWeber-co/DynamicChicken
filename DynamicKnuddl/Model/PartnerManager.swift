import Foundation

/// Simple partner messaging using NSUbiquitousKeyValueStore (iCloud Key-Value)
/// Each user gets a unique ID. Partners share codes to pair.
/// Messages are stored as JSON in iCloud KV store with the partner's ID as key.
class PartnerManager: ObservableObject {
    static let shared = PartnerManager()

    @Published var myCode: String = ""
    @Published var partnerCode: String = ""
    @Published var isPaired: Bool = false
    @Published var lastReceivedMessage: String = ""
    @Published var lastReceivedPetState: PetState?
    @Published var partnerName: String = ""

    private let store = NSUbiquitousKeyValueStore.default
    private let defaults = UserDefaults.standard

    private let myIDKey = "myPartnerID"
    private let partnerIDKey = "partnerID"
    private let partnerNameKey = "partnerName"

    private init() {
        // Generate or load my unique ID
        if let existing = defaults.string(forKey: myIDKey) {
            myCode = existing
        } else {
            let code = generateCode()
            defaults.set(code, forKey: myIDKey)
            myCode = code
        }

        // Load partner
        if let pid = defaults.string(forKey: partnerIDKey) {
            partnerCode = pid
            isPaired = true
            partnerName = defaults.string(forKey: partnerNameKey) ?? "Partner"
        }

        // Listen for iCloud changes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(icloudDidChange),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store
        )
        store.synchronize()

        // Check for messages
        checkForMessages()
    }

    // MARK: - Pairing

    func pairWith(code: String, name: String) {
        partnerCode = code.uppercased()
        partnerName = name
        isPaired = true
        defaults.set(partnerCode, forKey: partnerIDKey)
        defaults.set(partnerName, forKey: partnerNameKey)

        // Store our info so partner can find us
        let myInfo: [String: String] = ["name": name, "code": myCode]
        if let data = try? JSONEncoder().encode(myInfo) {
            store.set(String(data: data, encoding: .utf8), forKey: "pair_\(partnerCode)")
            store.synchronize()
        }
    }

    func unpair() {
        if !partnerCode.isEmpty {
            store.removeObject(forKey: "msg_to_\(myCode)")
            store.removeObject(forKey: "pair_\(partnerCode)")
            store.synchronize()
        }
        partnerCode = ""
        partnerName = ""
        isPaired = false
        lastReceivedMessage = ""
        lastReceivedPetState = nil
        defaults.removeObject(forKey: partnerIDKey)
        defaults.removeObject(forKey: partnerNameKey)
    }

    // MARK: - Messaging

    func sendMessage(_ text: String, petState: PetState? = nil) {
        guard isPaired else { return }

        let msg = PartnerMessage(
            senderCode: myCode,
            message: String(text.prefix(80)),
            petState: petState?.rawValue,
            timestamp: Date().timeIntervalSince1970
        )

        if let data = try? JSONEncoder().encode(msg),
           let json = String(data: data, encoding: .utf8) {
            // Store message for partner to read (keyed by partner's code)
            store.set(json, forKey: "msg_to_\(partnerCode)")
            store.synchronize()
        }
    }

    func checkForMessages() {
        store.synchronize()

        // Check if there's a message for me
        if let json = store.string(forKey: "msg_to_\(myCode)"),
           let data = json.data(using: .utf8),
           let msg = try? JSONDecoder().decode(PartnerMessage.self, from: data) {
            DispatchQueue.main.async {
                self.lastReceivedMessage = msg.message
                if let stateStr = msg.petState {
                    self.lastReceivedPetState = PetState(rawValue: stateStr)
                }
            }
        }
    }

    @objc private func icloudDidChange(_ notification: Notification) {
        checkForMessages()
    }

    private func generateCode() -> String {
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return String((0..<6).map { _ in chars.randomElement()! })
    }
}

struct PartnerMessage: Codable {
    let senderCode: String
    let message: String
    let petState: String?
    let timestamp: Double
}


import Foundation

/// Partner messaging using Firebase Realtime Database (REST API)
/// No SDK, no Apple Developer capabilities needed.
///
/// Database structure:
///   /messages/{recipientCode} → { senderCode, message, status, timestamp, senderName }
///   /users/{code} → { name, partnerCode, timestamp }
///
class PartnerManager: ObservableObject {
    static let shared = PartnerManager()

    @Published var myCode: String = ""
    @Published var partnerCode: String = ""
    @Published var isPaired: Bool = false
    @Published var lastReceivedMessage: String = ""
    @Published var lastReceivedStatus: String = ""
    @Published var partnerName: String = ""
    @Published var isSending: Bool = false
    @Published var connectionStatus: ConnectionStatus = .unknown
    @Published var lastError: String?

    enum ConnectionStatus: String {
        case unknown = "Unbekannt"
        case checking = "Pruefe..."
        case connected = "Verbunden"
        case error = "Fehler"
        case offline = "Offline"
    }

    private let defaults = UserDefaults.standard
    private let firebase = FirebaseService.shared

    private let myIDKey = "myPartnerID"
    private let partnerIDKey = "partnerID"
    private let partnerNameKey = "partnerName"
    private let lastReceivedMsgKey = "lastReceivedMsg"
    private let lastReceivedStatusKey = "lastReceivedStatus"
    private let myNameKey = "myDisplayName"

    private var pollTimer: Timer?
    private var lastReceivedTimestamp: Double = 0

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

        // Check connection & start polling
        checkFirebaseConnection()
        startPolling()
    }

    // MARK: - Connection Check

    func checkFirebaseConnection() {
        connectionStatus = .checking
        firebase.checkConnection { [weak self] reachable in
            DispatchQueue.main.async {
                if reachable {
                    self?.connectionStatus = .connected
                    self?.lastError = nil
                } else {
                    self?.connectionStatus = .offline
                    self?.lastError = "Firebase nicht erreichbar. Prüfe deine Internet-Verbindung und die Database-URL in FirebaseService.swift"
                }
            }
        }
    }

    // MARK: - Pairing

    func pairWith(code: String, name: String) {
        partnerCode = code.uppercased()
        partnerName = name
        isPaired = true
        defaults.set(partnerCode, forKey: partnerIDKey)
        defaults.set(partnerName, forKey: partnerNameKey)

        // Register myself in Firebase so partner can see my name
        let myName = defaults.string(forKey: myNameKey) ?? "Unbekannt"
        let userData: [String: Any] = [
            "name": myName,
            "partnerCode": partnerCode,
            "timestamp": Date().timeIntervalSince1970
        ]
        firebase.write(path: "users/\(myCode)", data: userData) { _, _ in }

        // Start polling for messages
        startPolling()
    }

    func setMyName(_ name: String) {
        defaults.set(name, forKey: myNameKey)
    }

    func getMyName() -> String {
        return defaults.string(forKey: myNameKey) ?? ""
    }

    func unpair() {
        // Clean up Firebase
        firebase.delete(path: "messages/\(myCode)") { _ in }

        partnerCode = ""
        partnerName = ""
        isPaired = false
        lastReceivedMessage = ""
        lastReceivedStatus = ""
        lastError = nil
        defaults.removeObject(forKey: partnerIDKey)
        defaults.removeObject(forKey: partnerNameKey)
        defaults.removeObject(forKey: lastReceivedMsgKey)
        defaults.removeObject(forKey: lastReceivedStatusKey)
        stopPolling()
    }

    // MARK: - Messaging via Firebase

    func sendMessage(_ text: String, status: String = "") {
        guard isPaired else { return }
        isSending = true
        lastError = nil

        let myName = defaults.string(forKey: myNameKey) ?? "Anonym"
        let messageData: [String: Any] = [
            "senderCode": myCode,
            "senderName": myName,
            "message": String(text.prefix(80)),
            "status": status,
            "timestamp": Date().timeIntervalSince1970
        ]

        // Write to partner's inbox
        firebase.write(path: "messages/\(partnerCode)", data: messageData) { [weak self] success, error in
            DispatchQueue.main.async {
                self?.isSending = false
                if success {
                    self?.lastError = nil
                    print("Message sent to \(self?.partnerCode ?? "")")
                } else {
                    self?.lastError = "Senden fehlgeschlagen: \(error?.localizedDescription ?? "Unbekannt")"
                    print("Send error: \(error?.localizedDescription ?? "unknown")")
                }
            }
        }
    }

    // MARK: - Polling for messages

    private func startPolling() {
        stopPolling()
        // Check immediately
        checkForMessages()
        // Then every 3 seconds
        pollTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            self?.checkForMessages()
        }
    }

    private func stopPolling() {
        pollTimer?.invalidate()
        pollTimer = nil
    }

    func checkForMessages() {
        guard !myCode.isEmpty else { return }

        firebase.read(path: "messages/\(myCode)") { [weak self] data, error in
            DispatchQueue.main.async {
                guard let self = self else { return }

                if let error = error {
                    // Don't overwrite connected status for transient errors
                    if self.connectionStatus != .connected {
                        self.connectionStatus = .error
                    }
                    print("Poll error: \(error.localizedDescription)")
                    return
                }

                self.connectionStatus = .connected

                guard let data = data else { return }

                let msg = data["message"] as? String ?? ""
                let status = data["status"] as? String ?? ""
                let timestamp = data["timestamp"] as? Double ?? 0
                let senderName = data["senderName"] as? String

                // Only process if this is a new message
                if timestamp > self.lastReceivedTimestamp {
                    self.lastReceivedTimestamp = timestamp

                    if !msg.isEmpty {
                        self.lastReceivedMessage = msg
                        self.defaults.set(msg, forKey: self.lastReceivedMsgKey)
                    }
                    if !status.isEmpty {
                        self.lastReceivedStatus = status
                        self.defaults.set(status, forKey: self.lastReceivedStatusKey)
                    }
                    // Update partner name from sender info
                    if let name = senderName, !name.isEmpty && self.partnerName.isEmpty {
                        self.partnerName = name
                        self.defaults.set(name, forKey: self.partnerNameKey)
                    }
                }
            }
        }
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

    /// Test Firebase roundtrip: send a message to yourself
    func testFirebaseRoundtrip() {
        isSending = true
        lastError = nil

        let testData: [String: Any] = [
            "senderCode": "TEST",
            "senderName": "Test",
            "message": "Firebase Test um \(formattedTime())",
            "status": "funktioniert!",
            "timestamp": Date().timeIntervalSince1970
        ]

        firebase.write(path: "messages/\(myCode)", data: testData) { [weak self] success, error in
            DispatchQueue.main.async {
                self?.isSending = false
                if success {
                    self?.lastError = nil
                    // Wait a moment then fetch
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self?.checkForMessages()
                    }
                } else {
                    self?.lastError = "Firebase Test fehlgeschlagen: \(error?.localizedDescription ?? "Unbekannt")"
                }
            }
        }
    }

    func clearReceivedMessage() {
        lastReceivedMessage = ""
        lastReceivedStatus = ""
        lastReceivedTimestamp = 0
        defaults.removeObject(forKey: lastReceivedMsgKey)
        defaults.removeObject(forKey: lastReceivedStatusKey)
        // Also clear from Firebase
        firebase.delete(path: "messages/\(myCode)") { _ in }
    }

    // MARK: - Helpers

    private func generateCode() -> String {
        let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return String((0..<6).map { _ in chars.randomElement()! })
    }

    private func formattedTime() -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: Date())
    }
}

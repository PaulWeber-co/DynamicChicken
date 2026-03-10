import Foundation
import CloudKit

/// Partner messaging using CloudKit Public Database
/// This allows two DIFFERENT iCloud accounts to exchange messages.
/// Each user gets a unique 6-char code. Partners pair by exchanging codes.
/// Messages are stored as CKRecords in the public database.
class PartnerManager: ObservableObject {
    static let shared = PartnerManager()

    @Published var myCode: String = ""
    @Published var partnerCode: String = ""
    @Published var isPaired: Bool = false
    @Published var lastReceivedMessage: String = ""
    @Published var lastReceivedPetState: PetState?
    @Published var partnerName: String = ""
    @Published var isSending: Bool = false
    @Published var lastError: String?
    @Published var connectionStatus: ConnectionStatus = .unknown

    enum ConnectionStatus: String {
        case unknown = "Unbekannt"
        case checking = "Prüfe..."
        case connected = "Verbunden"
        case error = "Fehler"
    }

    private let publicDB = CKContainer(identifier: "iCloud.com.paulweber.DynamicKnuddl").publicCloudDatabase
    private let defaults = UserDefaults.standard

    private let myIDKey = "myPartnerID"
    private let partnerIDKey = "partnerID"
    private let partnerNameKey = "partnerName"
    private let lastReceivedMsgKey = "lastReceivedMsg"
    private let lastReceivedStateKey = "lastReceivedState"

    private var pollTimer: Timer?
    private var lastMessageRecordID: CKRecord.ID?

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
        if let stateStr = defaults.string(forKey: lastReceivedStateKey) {
            lastReceivedPetState = PetState(rawValue: stateStr)
        }

        // Start polling for messages
        startPolling()
    }

    // MARK: - Pairing

    func pairWith(code: String, name: String) {
        partnerCode = code.uppercased()
        partnerName = name
        isPaired = true
        defaults.set(partnerCode, forKey: partnerIDKey)
        defaults.set(partnerName, forKey: partnerNameKey)

        // Start polling now that we're paired
        startPolling()
    }

    func unpair() {
        partnerCode = ""
        partnerName = ""
        isPaired = false
        lastReceivedMessage = ""
        lastReceivedPetState = nil
        defaults.removeObject(forKey: partnerIDKey)
        defaults.removeObject(forKey: partnerNameKey)
        defaults.removeObject(forKey: lastReceivedMsgKey)
        defaults.removeObject(forKey: lastReceivedStateKey)
        stopPolling()
    }

    // MARK: - Messaging via CloudKit Public DB

    func sendMessage(_ text: String, petState: PetState? = nil) {
        guard isPaired else { return }
        isSending = true
        lastError = nil

        let record = CKRecord(recordType: "PartnerMessage")
        record["senderCode"] = myCode as CKRecordValue
        record["recipientCode"] = partnerCode as CKRecordValue
        record["message"] = String(text.prefix(80)) as CKRecordValue
        record["petState"] = (petState?.rawValue ?? "") as CKRecordValue
        record["timestamp"] = Date() as CKRecordValue

        publicDB.save(record) { [weak self] savedRecord, error in
            DispatchQueue.main.async {
                self?.isSending = false
                if let error = error {
                    self?.lastError = "Senden fehlgeschlagen: \(error.localizedDescription)"
                    print("CloudKit save error: \(error)")
                } else {
                    self?.lastError = nil
                    print("Message sent successfully to \(self?.partnerCode ?? "")")
                }
            }
        }
    }

    func checkForMessages() {
        guard !myCode.isEmpty else { return }

        connectionStatus = .checking

        let predicate = NSPredicate(format: "recipientCode == %@", myCode)
        let query = CKQuery(recordType: "PartnerMessage", predicate: predicate)
        query.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]

        publicDB.perform(query, inZoneWith: nil) { [weak self] records, error in
            DispatchQueue.main.async {
                guard let self = self else { return }

                if let error = error {
                    self.connectionStatus = .error
                    self.lastError = "Empfang fehlgeschlagen: \(error.localizedDescription)"
                    print("CloudKit query error: \(error)")
                    return
                }

                self.connectionStatus = .connected

                if let record = records?.first {
                    let msg = record["message"] as? String ?? ""
                    let stateStr = record["petState"] as? String ?? ""

                    if !msg.isEmpty {
                        self.lastReceivedMessage = msg
                        self.defaults.set(msg, forKey: self.lastReceivedMsgKey)
                    }
                    if !stateStr.isEmpty, let state = PetState(rawValue: stateStr) {
                        self.lastReceivedPetState = state
                        self.defaults.set(stateStr, forKey: self.lastReceivedStateKey)
                    }

                    // Remember record ID so we can delete old ones
                    self.lastMessageRecordID = record.recordID
                }
            }
        }
    }

    // MARK: - Polling

    private func startPolling() {
        stopPolling()
        // Check immediately
        checkForMessages()
        // Then every 10 seconds
        pollTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            self?.checkForMessages()
        }
    }

    private func stopPolling() {
        pollTimer?.invalidate()
        pollTimer = nil
    }

    // MARK: - Testing

    /// Simulate receiving a message locally (no CloudKit needed)
    func simulateReceivedMessage(text: String = "Test Nachricht!", state: PetState? = .sleeping) {
        DispatchQueue.main.async {
            self.lastReceivedMessage = text
            self.lastReceivedPetState = state
            self.defaults.set(text, forKey: self.lastReceivedMsgKey)
            if let s = state {
                self.defaults.set(s.rawValue, forKey: self.lastReceivedStateKey)
            }
        }
    }

    /// Send a message to yourself (tests full CloudKit roundtrip)
    func testCloudKitRoundtrip() {
        isSending = true
        lastError = nil

        let record = CKRecord(recordType: "PartnerMessage")
        record["senderCode"] = "TEST" as CKRecordValue
        record["recipientCode"] = myCode as CKRecordValue
        record["message"] = "CloudKit Test um \(formattedTime())" as CKRecordValue
        record["petState"] = PetState.playing.rawValue as CKRecordValue
        record["timestamp"] = Date() as CKRecordValue

        publicDB.save(record) { [weak self] _, error in
            DispatchQueue.main.async {
                self?.isSending = false
                if let error = error {
                    self?.lastError = "CloudKit Test fehlgeschlagen: \(error.localizedDescription)"
                    print("CloudKit test error: \(error)")
                } else {
                    self?.lastError = nil
                    // Wait a moment, then fetch
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        self?.checkForMessages()
                    }
                }
            }
        }
    }

    /// Check if CloudKit is available
    func checkCloudKitStatus() {
        CKContainer(identifier: "iCloud.com.paulweber.DynamicKnuddl").accountStatus { [weak self] status, error in
            DispatchQueue.main.async {
                switch status {
                case .available:
                    self?.connectionStatus = .connected
                    self?.lastError = nil
                case .noAccount:
                    self?.connectionStatus = .error
                    self?.lastError = "Kein iCloud-Account angemeldet"
                case .restricted:
                    self?.connectionStatus = .error
                    self?.lastError = "iCloud ist eingeschränkt"
                case .couldNotDetermine:
                    self?.connectionStatus = .error
                    self?.lastError = error?.localizedDescription ?? "Unbekannter Fehler"
                case .temporarilyUnavailable:
                    self?.connectionStatus = .error
                    self?.lastError = "iCloud temporär nicht verfügbar"
                @unknown default:
                    self?.connectionStatus = .unknown
                }
            }
        }
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

struct PartnerMessage: Codable {
    let senderCode: String
    let message: String
    let petState: String?
    let timestamp: Double
}


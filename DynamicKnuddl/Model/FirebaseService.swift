import Foundation

/// Simple Firebase Realtime Database client using REST API
/// No SDK needed — just HTTP requests. Works without any Apple Developer capabilities.
///
/// SETUP: Replace the databaseURL below with your Firebase project URL.
/// You find it in Firebase Console → Realtime Database → the URL at the top.
class FirebaseService {
    static let shared = FirebaseService()

    // =====================================================================
    // IMPORTANT: Replace this with YOUR Firebase Realtime Database URL!
    // Go to: Firebase Console → Realtime Database → Copy the URL at the top
    // It looks like: https://YOUR-PROJECT-ID-default-rtdb.europe-west1.firebasedatabase.app
    // =====================================================================
    private let databaseURL = "https://YOUR-PROJECT-ID-default-rtdb.europe-west1.firebasedatabase.app"

    private let session = URLSession.shared

    private init() {}

    /// Write data to a path in the database
    func write(path: String, data: [String: Any], completion: @escaping (Bool, Error?) -> Void) {
        guard let url = URL(string: "\(databaseURL)/\(path).json") else {
            completion(false, NSError(domain: "FirebaseService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: data)
        } catch {
            completion(false, error)
            return
        }

        session.dataTask(with: request) { _, response, error in
            if let error = error {
                completion(false, error)
                return
            }
            let httpResponse = response as? HTTPURLResponse
            completion(httpResponse?.statusCode == 200, nil)
        }.resume()
    }

    /// Read data from a path in the database
    func read(path: String, completion: @escaping ([String: Any]?, Error?) -> Void) {
        guard let url = URL(string: "\(databaseURL)/\(path).json") else {
            completion(nil, NSError(domain: "FirebaseService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.cachePolicy = .reloadIgnoringLocalCacheData

        session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(nil, error)
                return
            }
            guard let data = data else {
                completion(nil, nil)
                return
            }
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    completion(json, nil)
                } else {
                    completion(nil, nil)
                }
            } catch {
                completion(nil, error)
            }
        }.resume()
    }

    /// Delete data at a path
    func delete(path: String, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(databaseURL)/\(path).json") else {
            completion(false)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"

        session.dataTask(with: request) { _, _, _ in
            completion(true)
        }.resume()
    }

    /// Check if Firebase is reachable
    func checkConnection(completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: "\(databaseURL)/.json?shallow=true") else {
            completion(false)
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 5

        session.dataTask(with: request) { _, response, error in
            let httpResponse = response as? HTTPURLResponse
            completion(error == nil && (httpResponse?.statusCode == 200 || httpResponse?.statusCode == 401))
        }.resume()
    }
}


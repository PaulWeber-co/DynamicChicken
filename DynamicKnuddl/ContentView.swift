import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = PetViewModel()

    var body: some View {
        DynamicIslandOverlay(viewModel: viewModel)
            .statusBarHidden(false)
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}


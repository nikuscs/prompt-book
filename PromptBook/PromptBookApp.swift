import SwiftUI
import SwiftData
#if os(macOS)
import AppKit
#endif

@main
struct PromptBookApp: App {
    private let sharedModelContainer: ModelContainer
    @StateObject private var store: PromptStore
    @AppStorage(PromptStore.PreferenceKeys.globalShortcutEnabled) private var globalShortcutEnabled = false

    init() {
        do {
            let container = try ModelContainer(for: Prompt.self)
            sharedModelContainer = container
            _store = StateObject(wrappedValue: PromptStore(modelContext: container.mainContext))
        } catch {
            fatalError("Failed to initialize SwiftData container: \(error)")
        }
    }

    var body: some Scene {
        #if os(macOS)
        Window("PromptBook", id: "main") {
            MainWindowView()
                .environmentObject(store)
                .frame(minWidth: 760, minHeight: 520)
                .onReceive(NotificationCenter.default.publisher(for: .promptBookOpenMainWindow)) { _ in
                    NSApp.activate(ignoringOtherApps: true)
                }
                .onAppear {
                    GlobalShortcutManager.shared.setEnabled(globalShortcutEnabled)
                }
                .onChange(of: globalShortcutEnabled) { _, enabled in
                    GlobalShortcutManager.shared.setEnabled(enabled)
                }
        }
        .modelContainer(sharedModelContainer)

        MenuBarExtra("📘") {
            MenuBarView()
                .environmentObject(store)
        }
        .menuBarExtraStyle(.window)
        .modelContainer(sharedModelContainer)

        Settings {
            SettingsView()
                .frame(width: 460)
        }
        .modelContainer(sharedModelContainer)
        #else
        WindowGroup("PromptBook") {
            MainWindowView()
                .environmentObject(store)
        }
        .modelContainer(sharedModelContainer)
        #endif

    }
}

private struct SettingsView: View {
    @AppStorage(PromptStore.PreferenceKeys.copyWeight) private var copyWeight = 0.7
    @AppStorage(PromptStore.PreferenceKeys.searchWeight) private var searchWeight = 0.3
    @AppStorage(PromptStore.PreferenceKeys.recencyBoost) private var recencyBoost = 2.0
    @AppStorage(PromptStore.PreferenceKeys.recencyWindowHours) private var recencyWindowHours = 72.0
    @AppStorage(PromptStore.PreferenceKeys.globalShortcutEnabled) private var globalShortcutEnabled = false

    var body: some View {
        Form {
            Section("Ranking") {
                LabeledContent("Copy Weight") {
                    Text(copyWeight, format: .number.precision(.fractionLength(2)))
                        .monospacedDigit()
                }
                Slider(value: $copyWeight, in: 0...1, step: 0.05)

                LabeledContent("Search Weight") {
                    Text(searchWeight, format: .number.precision(.fractionLength(2)))
                        .monospacedDigit()
                }
                Slider(value: $searchWeight, in: 0...1, step: 0.05)

                LabeledContent("Recency Boost") {
                    Text(recencyBoost, format: .number.precision(.fractionLength(1)))
                        .monospacedDigit()
                }
                Slider(value: $recencyBoost, in: 0...10, step: 0.5)

                LabeledContent("Recency Window (hrs)") {
                    Text(Int(recencyWindowHours), format: .number)
                        .monospacedDigit()
                }
                Slider(value: $recencyWindowHours, in: 12...168, step: 12)
            }

            Section("Keyboard") {
                Toggle("Enable global quick open shortcut", isOn: $globalShortcutEnabled)
                Text("Shortcut: Cmd+Shift+Space")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .padding(18)
    }
}

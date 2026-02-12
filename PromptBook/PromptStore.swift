import Foundation
import SwiftData

@MainActor
final class PromptStore: ObservableObject {
    enum PreferenceKeys {
        static let copyWeight = "ranking.copyWeight"
        static let searchWeight = "ranking.searchWeight"
        static let recencyBoost = "ranking.recencyBoost"
        static let recencyWindowHours = "ranking.recencyWindowHours"
        static let globalShortcutEnabled = "shortcut.enabled"
    }

    @Published private(set) var prompts: [Prompt] = []

    @Published var searchText = ""
    @Published var editingPromptID: Prompt.ID?
    private let modelContext: ModelContext
    private let userDefaults: UserDefaults
    private var lastRecordedSearchQuery = ""

    init(modelContext: ModelContext, userDefaults: UserDefaults = .standard, seedSamples: Bool = true) {
        self.modelContext = modelContext
        self.userDefaults = userDefaults
        if seedSamples {
            seedIfNeeded()
        }
        reloadPrompts()
    }

    var filteredPrompts: [Prompt] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return prompts }
        let lower = query.lowercased()
        return prompts.filter {
            $0.title.lowercased().contains(lower) || $0.contentMarkdown.lowercased().contains(lower)
        }
    }

    var topPrompts: [Prompt] {
        let rankingService = PromptRankingService(
            copyWeight: userDefaults.object(forKey: PreferenceKeys.copyWeight) as? Double ?? 0.7,
            searchWeight: userDefaults.object(forKey: PreferenceKeys.searchWeight) as? Double ?? 0.3,
            recencyBoost: userDefaults.object(forKey: PreferenceKeys.recencyBoost) as? Double ?? 2.0,
            recencyWindowHours: userDefaults.object(forKey: PreferenceKeys.recencyWindowHours) as? Double ?? 72.0
        )
        return Array(prompts
            .sorted { lhs, rhs in
                let lhsScore = rankingService.score(for: lhs)
                let rhsScore = rankingService.score(for: rhs)
                if lhsScore == rhsScore {
                    return lhs.updatedAt > rhs.updatedAt
                }
                return lhsScore > rhsScore
            }
            .prefix(8))
    }

    func addPrompt() {
        let newPrompt = Prompt(title: "New Prompt", contentMarkdown: "Write your markdown prompt here.")
        modelContext.insert(newPrompt)
        saveContext()
        reloadPrompts()
        editingPromptID = newPrompt.id
    }

    func deletePrompt(id: Prompt.ID) {
        guard let prompt = prompts.first(where: { $0.id == id }) else { return }
        modelContext.delete(prompt)
        saveContext()
        reloadPrompts()
        if editingPromptID == id {
            editingPromptID = nil
        }
    }

    func savePrompt(id: Prompt.ID, title: String, contentMarkdown: String) {
        guard let prompt = prompts.first(where: { $0.id == id }) else { return }
        prompt.title = title
        prompt.contentMarkdown = contentMarkdown
        prompt.updatedAt = .now
        saveContext()
        reloadPrompts()
    }

    func recordCopy(id: Prompt.ID) {
        guard let prompt = prompts.first(where: { $0.id == id }) else { return }
        prompt.copyCount += 1
        prompt.lastCopiedAt = .now
        prompt.updatedAt = .now
        saveContext()
        reloadPrompts()
    }

    func recordSearchHits() {
        let normalized = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalized.isEmpty else { return }
        guard normalized != lastRecordedSearchQuery else { return }
        lastRecordedSearchQuery = normalized

        let ids = Set(filteredPrompts.map(\.id))
        guard !ids.isEmpty else { return }
        for prompt in prompts where ids.contains(prompt.id) {
            prompt.searchCount += 1
            prompt.lastMatchedSearchAt = .now
            prompt.updatedAt = .now
        }
        saveContext()
        reloadPrompts()
    }

    private func reloadPrompts() {
        let descriptor = FetchDescriptor<Prompt>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        do {
            prompts = try modelContext.fetch(descriptor)
        } catch {
            prompts = []
            print("PromptStore fetch error: \(error.localizedDescription)")
        }
    }

    private func saveContext() {
        do {
            try modelContext.save()
        } catch {
            print("PromptStore save error: \(error.localizedDescription)")
        }
    }

    private func seedIfNeeded() {
        var descriptor = FetchDescriptor<Prompt>()
        descriptor.fetchLimit = 1
        let hasData = (try? modelContext.fetch(descriptor).isEmpty == false) ?? false
        guard !hasData else { return }

        let samples = [
            Prompt(
                title: "Bug Triage",
                contentMarkdown: """
                ## Task
                Review this bug report and return:
                1. Root cause
                2. Minimal fix
                3. Regression tests
                """,
                copyCount: 12,
                searchCount: 7
            ),
            Prompt(
                title: "PR Review",
                contentMarkdown: """
                Review this PR like a senior engineer. Focus on:
                - behavioral regressions
                - missing tests
                - performance risks
                """,
                copyCount: 20,
                searchCount: 12
            ),
            Prompt(
                title: "Write Release Notes",
                contentMarkdown: """
                Produce concise release notes from these commits:
                - grouped by feature/fix/chore
                - include migration warnings
                - include known issues
                """,
                copyCount: 6,
                searchCount: 10
            ),
        ]

        for sample in samples {
            modelContext.insert(sample)
        }
        saveContext()
    }
}

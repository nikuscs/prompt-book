import Foundation

struct PromptRankingService {
    let copyWeight: Double
    let searchWeight: Double
    let recencyBoost: Double
    let recencyWindowHours: Double

    func score(for prompt: Prompt, now: Date = .now) -> Double {
        let weighted = (Double(prompt.copyCount) * copyWeight) + (Double(prompt.searchCount) * searchWeight)
        return weighted + recencyLift(for: prompt, now: now)
    }

    private func recencyLift(for prompt: Prompt, now: Date) -> Double {
        guard recencyWindowHours > 0 else { return 0 }
        guard let lastActiveDate = [prompt.lastCopiedAt, prompt.lastMatchedSearchAt].compactMap({ $0 }).max() else {
            return 0
        }
        let elapsedSeconds = now.timeIntervalSince(lastActiveDate)
        let elapsedHours = max(0, elapsedSeconds / 3600)
        guard elapsedHours < recencyWindowHours else { return 0 }
        let ratio = 1 - (elapsedHours / recencyWindowHours)
        return recencyBoost * ratio
    }
}

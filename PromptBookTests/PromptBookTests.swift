import XCTest

@MainActor
final class PromptBookTests: XCTestCase {
    func testRankingUsesCopyAndSearchWeights() {
        let prompt = Prompt(title: "A", contentMarkdown: "B", copyCount: 10, searchCount: 10)
        let ranking = PromptRankingService(copyWeight: 0.8, searchWeight: 0.2, recencyBoost: 0, recencyWindowHours: 24)
        XCTAssertEqual(ranking.score(for: prompt), 10.0, accuracy: 0.001)
    }

    func testRankingRecencyBoostDecaysOverTime() {
        let baseDate = Date(timeIntervalSince1970: 1_000_000)
        let prompt = Prompt(
            title: "A",
            contentMarkdown: "B",
            copyCount: 0,
            searchCount: 0,
            lastCopiedAt: baseDate
        )
        let ranking = PromptRankingService(copyWeight: 0, searchWeight: 0, recencyBoost: 4, recencyWindowHours: 4)

        let nearScore = ranking.score(for: prompt, now: baseDate.addingTimeInterval(60 * 60))
        let lateScore = ranking.score(for: prompt, now: baseDate.addingTimeInterval(60 * 60 * 3))

        XCTAssertGreaterThan(nearScore, lateScore)
        XCTAssertGreaterThan(lateScore, 0)
    }

    func testPromptFieldsAreMutable() {
        let prompt = Prompt(title: "Old", contentMarkdown: "A")
        prompt.title = "New"
        prompt.contentMarkdown = "B"
        prompt.searchCount += 2
        prompt.copyCount += 1

        XCTAssertEqual(prompt.title, "New")
        XCTAssertEqual(prompt.contentMarkdown, "B")
        XCTAssertEqual(prompt.searchCount, 2)
        XCTAssertEqual(prompt.copyCount, 1)
    }
}

import Foundation
import SwiftData

@Model
final class Prompt: Identifiable {
    @Attribute(.unique) var id: UUID
    var title: String
    var contentMarkdown: String
    var copyCount: Int
    var searchCount: Int
    var lastCopiedAt: Date?
    var lastMatchedSearchAt: Date?
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        title: String,
        contentMarkdown: String,
        copyCount: Int = 0,
        searchCount: Int = 0,
        lastCopiedAt: Date? = nil,
        lastMatchedSearchAt: Date? = nil,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.title = title
        self.contentMarkdown = contentMarkdown
        self.copyCount = copyCount
        self.searchCount = searchCount
        self.lastCopiedAt = lastCopiedAt
        self.lastMatchedSearchAt = lastMatchedSearchAt
        self.updatedAt = updatedAt
    }
}

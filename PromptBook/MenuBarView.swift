#if os(macOS)
import AppKit
import SwiftUI

struct MenuBarView: View {
    @EnvironmentObject private var store: PromptStore
    @Environment(\.openWindow) private var openWindow
    @State private var hoveredPromptID: Prompt.ID?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Top Prompts")
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 10)

            ForEach(store.topPrompts) { prompt in
                HStack(spacing: 8) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(prompt.title)
                            .font(.body)
                            .lineLimit(1)
                        Text("Copied \(prompt.copyCount) • Searched \(prompt.searchCount)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if hoveredPromptID == prompt.id {
                        Button {
                            store.editingPromptID = prompt.id
                            openWindow(id: "main")
                            NSApp.activate(ignoringOtherApps: true)
                        } label: {
                            Image(systemName: "pencil")
                                .font(.body.weight(.semibold))
                                .accessibilityLabel("Edit")
                        }
                        .buttonStyle(.plain)
                    }
                }
                .contentShape(Rectangle())
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(Color(NSColor.windowBackgroundColor), in: RoundedRectangle(cornerRadius: 10))
                .onTapGesture {
                    copy(prompt)
                }
                .onHover { isHovering in
                    hoveredPromptID = isHovering ? prompt.id : nil
                }
            }

            Divider()

            HStack {
                Button("Open PromptBook") {
                    openWindow(id: "main")
                    NSApp.activate(ignoringOtherApps: true)
                }
                Spacer()
                Button("New") {
                    store.addPrompt()
                    openWindow(id: "main")
                    NSApp.activate(ignoringOtherApps: true)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 4)

            HStack {
                Button("Settings") {
                    NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
                    NSApp.activate(ignoringOtherApps: true)
                }
                Spacer()
                Button("Quit") {
                    NSApp.terminate(nil)
                }
            }
            .padding(.horizontal, 10)
            .padding(.bottom, 4)
        }
        .frame(width: 360)
        .padding(10)
    }

    private func copy(_ prompt: Prompt) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(prompt.contentMarkdown, forType: .string)
        store.recordCopy(id: prompt.id)
    }
}
#endif

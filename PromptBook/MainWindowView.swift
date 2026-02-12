import SwiftUI
#if os(macOS)
import AppKit
#endif

struct MainWindowView: View {
    @EnvironmentObject private var store: PromptStore
    @State private var selectedPromptID: Prompt.ID?
    @State private var pendingDeletePromptID: Prompt.ID?

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedPromptID) {
                ForEach(store.filteredPrompts) { prompt in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(prompt.title)
                            .font(.headline)
                        Text(prompt.contentMarkdown)
                            .lineLimit(2)
                            .foregroundStyle(.secondary)
                    }
                    .tag(prompt.id)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        selectedPromptID = prompt.id
                    }
                    .contextMenu {
                        Button("Delete", role: .destructive) {
                            pendingDeletePromptID = prompt.id
                        }
                    }
                }
            }
            .navigationTitle("PromptBook")
            .searchable(text: $store.searchText, prompt: "Search prompts")
            .onChange(of: store.searchText) { _, _ in
                store.recordSearchHits()
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("New Prompt") {
                        store.addPrompt()
                        selectedPromptID = store.editingPromptID
                    }
                }
                ToolbarItem(placement: .automatic) {
                    Button("Delete", role: .destructive) {
                        pendingDeletePromptID = selectedPromptID
                    }
                    .disabled(selectedPromptID == nil)
                }
            }
            .onAppear {
                selectedPromptID = store.filteredPrompts.first?.id
            }
        } detail: {
            if let prompt = selectedPrompt {
                PromptEditorView(prompt: prompt) { title, content in
                    store.savePrompt(id: prompt.id, title: title, contentMarkdown: content)
                }
                .id(prompt.id)
                .padding(20)
            } else {
                Text("Select a Prompt")
                    .foregroundStyle(.secondary)
            }
        }
        .onChange(of: store.editingPromptID) { _, newID in
            guard let newID else { return }
            selectedPromptID = newID
        }
        .alert("Delete prompt?", isPresented: isDeleteAlertPresented) {
            Button("Delete", role: .destructive) {
                guard let id = pendingDeletePromptID else { return }
                store.deletePrompt(id: id)
                selectedPromptID = store.filteredPrompts.first?.id
                pendingDeletePromptID = nil
            }
            Button("Cancel", role: .cancel) {
                pendingDeletePromptID = nil
            }
        } message: {
            Text("This action cannot be undone.")
        }
    }

    private var selectedPrompt: Prompt? {
        guard let id = selectedPromptID else { return nil }
        return store.prompts.first { $0.id == id }
    }

    private var isDeleteAlertPresented: Binding<Bool> {
        Binding(
            get: { pendingDeletePromptID != nil },
            set: { isPresented in
                if !isPresented {
                    pendingDeletePromptID = nil
                }
            }
        )
    }
}

private struct PromptEditorView: View {
    private enum EditorMode: String, CaseIterable, Identifiable {
        case raw = "Raw"
        case preview = "Preview"

        var id: String { rawValue }
    }

    let prompt: Prompt
    let onSave: (String, String) -> Void

    @State private var title: String
    @State private var content: String
    @State private var mode: EditorMode = .raw
    @State private var autosaveTask: Task<Void, Never>?
    @State private var lastSavedTitle: String
    @State private var lastSavedContent: String

    init(prompt: Prompt, onSave: @escaping (String, String) -> Void) {
        self.prompt = prompt
        self.onSave = onSave
        _title = State(initialValue: prompt.title)
        _content = State(initialValue: prompt.contentMarkdown)
        _lastSavedTitle = State(initialValue: prompt.title)
        _lastSavedContent = State(initialValue: prompt.contentMarkdown)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Title", text: $title)
                .textFieldStyle(.roundedBorder)
            HStack {
                Text("Markdown")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Picker("Mode", selection: $mode) {
                    ForEach(EditorMode.allCases) { item in
                        Text(item.rawValue).tag(item)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 220)
            }
            if mode == .raw {
                TextEditor(text: $content)
                    .font(.system(.body, design: .rounded))
                    .frame(minHeight: 380)
                    .padding(8)
                    .background(editorBackground, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )
            } else {
                NativeMarkdownPreview(markdown: content)
                    .frame(minHeight: 380)
                    .background(editorBackground, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )
            }
            HStack {
                Spacer()
                Button("Save") {
                    autosaveTask?.cancel()
                    onSave(title, content)
                    lastSavedTitle = title
                    lastSavedContent = content
                }
                .keyboardShortcut("s", modifiers: .command)
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .onChange(of: prompt.id) { _, _ in
            autosaveTask?.cancel()
            title = prompt.title
            content = prompt.contentMarkdown
            lastSavedTitle = prompt.title
            lastSavedContent = prompt.contentMarkdown
        }
        .onChange(of: title) { _, _ in
            scheduleAutosave()
        }
        .onChange(of: content) { _, _ in
            scheduleAutosave()
        }
        .onDisappear {
            autosaveTask?.cancel()
            commitAutosaveIfNeeded()
        }
    }

    private var editorBackground: Color {
        #if os(macOS)
        return Color(nsColor: .textBackgroundColor)
        #else
        return Color(uiColor: .secondarySystemBackground)
        #endif
    }

    private func scheduleAutosave() {
        autosaveTask?.cancel()
        autosaveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 700_000_000)
            commitAutosaveIfNeeded()
        }
    }

    private func commitAutosaveIfNeeded() {
        guard title != lastSavedTitle || content != lastSavedContent else { return }
        onSave(title, content)
        lastSavedTitle = title
        lastSavedContent = content
    }
}

private struct NativeMarkdownPreview: View {
    let markdown: String

    var body: some View {
        #if os(macOS)
        macPreview
        #else
        ScrollView {
            Text(.init(markdown))
                .font(.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
        }
        #endif
    }

    #if os(macOS)
    private var macPreview: some View {
        MacMarkdownTextView(markdown: markdown)
    }
    #endif
}

#if os(macOS)
private struct MacMarkdownTextView: NSViewRepresentable {
    let markdown: String

    func makeNSView(context: Context) -> NSScrollView {
        let textView = NSTextView()
        textView.isEditable = false
        textView.isSelectable = true
        textView.drawsBackground = false
        textView.textContainerInset = NSSize(width: 14, height: 14)
        textView.textContainer?.lineFragmentPadding = 0
        textView.isRichText = true
        textView.usesAdaptiveColorMappingForDarkAppearance = true

        let scroll = NSScrollView()
        scroll.hasVerticalScroller = true
        scroll.borderType = .noBorder
        scroll.drawsBackground = false
        scroll.documentView = textView
        return scroll
    }

    func updateNSView(_ scrollView: NSScrollView, context: Context) {
        guard let textView = scrollView.documentView as? NSTextView else { return }
        textView.textStorage?.setAttributedString(render(markdown: markdown))
    }

    private func render(markdown: String) -> NSAttributedString {
        let bodyFont = NSFont.systemFont(ofSize: 15)
        let h1Font = NSFont.systemFont(ofSize: 25, weight: .bold)
        let h2Font = NSFont.systemFont(ofSize: 21, weight: .semibold)
        let h3Font = NSFont.systemFont(ofSize: 18, weight: .semibold)
        let listFont = NSFont.systemFont(ofSize: 15)

        let bodyStyle = NSMutableParagraphStyle()
        bodyStyle.lineSpacing = 4
        bodyStyle.paragraphSpacing = 8

        let listStyle = NSMutableParagraphStyle()
        listStyle.lineSpacing = 3
        listStyle.paragraphSpacing = 4
        listStyle.headIndent = 18

        let out = NSMutableAttributedString()
        let lines = markdown.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: "\n")

        func append(_ text: String, font: NSFont, style: NSParagraphStyle) {
            out.append(NSAttributedString(
                string: text,
                attributes: [
                    .font: font,
                    .foregroundColor: NSColor.labelColor,
                    .paragraphStyle: style,
                ]
            ))
        }

        for raw in lines {
            let line = raw.trimmingCharacters(in: .whitespaces)
            if line.isEmpty {
                append("\n", font: bodyFont, style: bodyStyle)
                continue
            }
            if line.hasPrefix("### ") {
                append(String(line.dropFirst(4)) + "\n", font: h3Font, style: bodyStyle)
                continue
            }
            if line.hasPrefix("## ") {
                append(String(line.dropFirst(3)) + "\n", font: h2Font, style: bodyStyle)
                continue
            }
            if line.hasPrefix("# ") {
                append(String(line.dropFirst(2)) + "\n", font: h1Font, style: bodyStyle)
                continue
            }
            if line.range(of: #"^\d+\.\s+"#, options: .regularExpression) != nil {
                let item = line.replacingOccurrences(of: #"^\d+\.\s+"#, with: "• ", options: .regularExpression)
                append(item + "\n", font: listFont, style: listStyle)
                continue
            }
            if line.hasPrefix("- ") || line.hasPrefix("* ") {
                append("• " + String(line.dropFirst(2)) + "\n", font: listFont, style: listStyle)
                continue
            }
            append(line + "\n", font: bodyFont, style: bodyStyle)
        }
        return out
    }
}
#endif

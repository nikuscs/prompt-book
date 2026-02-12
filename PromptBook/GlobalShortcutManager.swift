import Foundation

extension Notification.Name {
    static let promptBookOpenMainWindow = Notification.Name("promptBookOpenMainWindow")
}

#if os(macOS)
import AppKit
import Carbon

@MainActor
final class GlobalShortcutManager {
    static let shared = GlobalShortcutManager()

    private var hotKeyRef: EventHotKeyRef?
    private var eventHandlerRef: EventHandlerRef?

    private init() {}

    func setEnabled(_ isEnabled: Bool) {
        if isEnabled {
            registerIfNeeded()
        } else {
            unregister()
        }
    }

    private func registerIfNeeded() {
        guard hotKeyRef == nil else { return }

        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        let callback: EventHandlerUPP = { _, event, _ in
            var hotKeyID = EventHotKeyID()
            let status = GetEventParameter(
                event,
                EventParamName(kEventParamDirectObject),
                EventParamType(typeEventHotKeyID),
                nil,
                MemoryLayout<EventHotKeyID>.size,
                nil,
                &hotKeyID
            )
            if status == noErr && hotKeyID.id == 1 {
                DispatchQueue.main.async {
                    NSApp.activate(ignoringOtherApps: true)
                    NotificationCenter.default.post(name: .promptBookOpenMainWindow, object: nil)
                }
            }
            return noErr
        }

        InstallEventHandler(GetEventDispatcherTarget(), callback, 1, &eventType, nil, &eventHandlerRef)

        var hotKeyID = EventHotKeyID(signature: OSType(0x50424B59), id: 1) // PBKY
        RegisterEventHotKey(
            UInt32(kVK_Space),
            UInt32(cmdKey | shiftKey),
            hotKeyID,
            GetEventDispatcherTarget(),
            0,
            &hotKeyRef
        )
    }

    private func unregister() {
        if let hotKeyRef {
            UnregisterEventHotKey(hotKeyRef)
            self.hotKeyRef = nil
        }
        if let eventHandlerRef {
            RemoveEventHandler(eventHandlerRef)
            self.eventHandlerRef = nil
        }
    }
}
#endif

use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::{EventTarget, Manager, Position, Size, WindowEvent};
mod storage;
use std::fs;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
#[cfg(target_os = "macos")]
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt as PanelManagerExt, PanelLevel, StyleMask,
    WebviewWindowExt,
};

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[tauri::command]
fn load_prompts() -> Result<Vec<storage::PromptRecord>, String> {
    storage::load_prompts()
}

#[tauri::command]
fn save_prompts(
    window: tauri::Window,
    app: tauri::AppHandle,
    prompts: Vec<storage::PromptRecord>,
) -> Result<(), String> {
    storage::save_prompts(prompts)?;
    let payload = serde_json::json!({
        "source": window.label()
    });
    // Emit directly to webview windows. Frontend uses `window.listen(...)`,
    // which is tied to `EventTarget::webview_window(...)` delivery.
    let _ = app.emit_to(
        EventTarget::webview_window("main"),
        "prompts-updated",
        payload.clone(),
    );
    let _ = app.emit_to(
        EventTarget::webview_window("menubar"),
        "prompts-updated",
        payload,
    );
    Ok(())
}

#[tauri::command]
fn get_prompt_path(prompt_id: String, title: String) -> Result<String, String> {
    storage::get_prompt_path(&prompt_id, &title)
}

fn slugify_title(title: &str) -> String {
    let mut out = String::new();
    let mut prev_dash = false;
    for ch in title.chars().flat_map(|c| c.to_lowercase()) {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            prev_dash = false;
        } else if !prev_dash {
            out.push('-');
            prev_dash = true;
        }
    }
    let trimmed = out.trim_matches('-');
    if trimmed.is_empty() {
        "untitled".to_string()
    } else {
        trimmed.chars().take(72).collect()
    }
}

#[tauri::command]
fn open_prompt_in_editor(editor: String, title: String, content: String) -> Result<(), String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    let temp_dir = std::path::PathBuf::from(home)
        .join(".config")
        .join("promptbook")
        .join(".tmp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("create temp dir: {}", e))?;

    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let file_name = format!("{}-{}.md", slugify_title(&title), ts);
    let file_path = temp_dir.join(file_name);
    fs::write(&file_path, content).map_err(|e| format!("write temp prompt: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        let app_name = match editor.as_str() {
            "cursor" => "Cursor",
            "vscode" => "Visual Studio Code",
            "zed" => "Zed",
            _ => return Err("Unsupported editor".to_string()),
        };

        let status = Command::new("open")
            .arg("-a")
            .arg(app_name)
            .arg(&file_path)
            .status()
            .map_err(|e| format!("open editor: {}", e))?;

        if status.success() {
            return Ok(());
        }
        Err(format!("Failed to open {}.", app_name))
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = editor;
        Err("Open in editor is only supported on macOS right now.".to_string())
    }
}

#[cfg(target_os = "macos")]
tauri_panel! {
    panel!(PromptBookMenubarPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })

    panel_event!(PromptBookMenubarPanelEventHandler {
        window_did_resign_key(notification: &NSNotification) -> ()
    })
}

#[cfg(target_os = "macos")]
fn init_menubar_panel(app: &tauri::AppHandle) -> tauri::Result<()> {
    if app.get_webview_panel("menubar").is_ok() {
        return Ok(());
    }

    let window = app.get_webview_window("menubar").unwrap();
    let panel = window.to_panel::<PromptBookMenubarPanel>()?;

    // OpenUsage approach: disable native shadow to avoid host-window edge artifacts.
    panel.set_has_shadow(false);
    panel.set_opaque(false);
    panel.set_level(PanelLevel::MainMenu.value() + 1);
    panel.set_collection_behavior(
        CollectionBehavior::new()
            .can_join_all_spaces()
            .stationary()
            .full_screen_auxiliary()
            .value(),
    );
    panel.set_style_mask(StyleMask::empty().nonactivating_panel().value());

    let event_handler = PromptBookMenubarPanelEventHandler::new();
    let handle = app.clone();
    event_handler.window_did_resign_key(move |_notification| {
        if let Ok(panel) = handle.get_webview_panel("menubar") {
            panel.hide();
        }
    });
    panel.set_event_handler(Some(event_handler.as_ref()));

    Ok(())
}

#[tauri::command]
fn open_main_window(app: tauri::AppHandle) {
    show_main_window(&app);
    #[cfg(target_os = "macos")]
    {
        if let Ok(panel) = app.get_webview_panel("menubar") {
            panel.hide();
            return;
        }
    }
    if let Some(window) = app.get_webview_window("menubar") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn open_main_window_for_prompt(app: tauri::AppHandle, prompt_id: String) {
    open_main_window(app.clone());
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("focus-prompt-editor", serde_json::json!({ "promptId": prompt_id }));
    }
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn position_menubar_at_tray_icon(app: &tauri::AppHandle, icon_position: Position, icon_size: Size) {
    let Some(window) = app.get_webview_window("menubar") else {
        return;
    };

    let (icon_phys_x, icon_phys_y) = match &icon_position {
        Position::Physical(pos) => (pos.x, pos.y),
        Position::Logical(pos) => (pos.x as i32, pos.y as i32),
    };

    let Some(monitors) = window.available_monitors().ok() else {
        return;
    };
    let Some(monitor) = monitors.into_iter().find(|m| {
        let pos = m.position();
        let size = m.size();
        let x_in = icon_phys_x >= pos.x && icon_phys_x < pos.x + size.width as i32;
        let y_in = icon_phys_y >= pos.y && icon_phys_y < pos.y + size.height as i32;
        x_in && y_in
    }) else {
        return;
    };

    let scale_factor = monitor.scale_factor();
    let Some(window_size) = window.outer_size().ok() else {
        return;
    };
    let window_width_phys = window_size.width as i32;

    let (icon_phys_x, icon_phys_y, icon_width_phys, icon_height_phys) =
        match (icon_position, icon_size) {
            (Position::Physical(pos), Size::Physical(size)) => {
                (pos.x, pos.y, size.width as i32, size.height as i32)
            }
            (Position::Logical(pos), Size::Logical(size)) => (
                (pos.x * scale_factor) as i32,
                (pos.y * scale_factor) as i32,
                (size.width * scale_factor) as i32,
                (size.height * scale_factor) as i32,
            ),
            (Position::Physical(pos), Size::Logical(size)) => (
                pos.x,
                pos.y,
                (size.width * scale_factor) as i32,
                (size.height * scale_factor) as i32,
            ),
            (Position::Logical(pos), Size::Physical(size)) => (
                (pos.x * scale_factor) as i32,
                (pos.y * scale_factor) as i32,
                size.width as i32,
                size.height as i32,
            ),
        };

    let icon_center_x_phys = icon_phys_x + (icon_width_phys / 2);
    let panel_x_phys = icon_center_x_phys - (window_width_phys / 2);

    // Keep the popover visually attached to the tray icon.
    let nudge_up_points = 7.0_f64;
    let nudge_up_phys = (nudge_up_points * scale_factor).round() as i32;
    let panel_y_phys = icon_phys_y + icon_height_phys - nudge_up_phys;

    let _ = window.set_position(tauri::PhysicalPosition::new(panel_x_phys, panel_y_phys));
}

fn toggle_menubar_window(app: &tauri::AppHandle, rect: tauri::Rect) {
    if let Some(window) = app.get_webview_window("menubar") {
        #[cfg(target_os = "macos")]
        if let Ok(panel) = app.get_webview_panel("menubar") {
            if panel.is_visible() {
                panel.hide();
                return;
            }
            // macOS quirk from OpenUsage: show first, then position for multi-monitor correctness.
            panel.show_and_make_key();
            let _ = window.emit("menubar-opened", ());
            position_menubar_at_tray_icon(app, rect.position, rect.size);
            return;
        }

        let visible = window.is_visible().unwrap_or(false);
        if visible {
            let _ = window.hide();
            return;
        }
        position_menubar_at_tray_icon(app, rect.position, rect.size);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("menubar-opened", ());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } if window.label() == "main" => {
                api.prevent_close();
                let _ = window.hide();
            }
            WindowEvent::Focused(false) if window.label() == "menubar" => {
                let _ = window.hide();
            }
            _ => {}
        })
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                let _ = init_menubar_panel(app.app_handle());
            }

            let app_name = app
                .config()
                .product_name
                .clone()
                .unwrap_or_else(|| app.package_info().name.clone());

            let tray_menu = MenuBuilder::new(app)
                .text("open", "Open Full Window")
                .separator()
                .text("quit", format!("Quit {app_name}"))
                .build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_menubar_window(app, rect);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ping,
            open_main_window,
            open_main_window_for_prompt,
            load_prompts,
            save_prompts,
            get_prompt_path,
            open_prompt_in_editor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

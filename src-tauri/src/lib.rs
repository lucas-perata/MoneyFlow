use tauri::tray::{MouseButton,TrayIconBuilder, TrayIconEvent};
use tauri::{
    menu::{Menu, MenuItem, MenuItemBuilder},
    Manager,
};

#[tauri::command]
fn get_exe_path() -> String {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            return parent.to_string_lossy().to_string();
        }
    }
    String::new()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut ctx: tauri::Context<tauri::Wry> = tauri::generate_context!();
    tauri::Builder::default()
        .setup(|app| {
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let toggle = MenuItemBuilder::with_id("st", "Start / Pause").build(app)?;
            let menu = Menu::with_items(app, &[&toggle, &quit])?;
            let menu_clone = menu.clone();
            let tray = TrayIconBuilder::new()
                .on_tray_icon_event(move |tray, event| match event {
                    TrayIconEvent::DoubleClick {
                        button: MouseButton::Left,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    },
                    _ => {
                    }
                })
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    },
                    "st" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.eval("window.handleStartStop()").unwrap();
                        }
                    }
                    _ => {
                    }
                })
                .menu(&menu_clone)
                .show_menu_on_left_click(false)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app);
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_theme::init(ctx.config_mut()))
        .invoke_handler(tauri::generate_handler![get_exe_path])
        .run(ctx)
        .expect("error while running tauri application");
}

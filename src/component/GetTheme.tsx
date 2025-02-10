import { invoke } from "@tauri-apps/api/core";

export async function GetTheme() {
    var theme = await invoke("plugin:theme|get_theme");
    return theme; 
}
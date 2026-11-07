use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{Emitter, Manager, Window};

#[derive(Clone, Serialize)]
struct DownloadProgress {
    model_id: String,
    file_name: String,
    downloaded: u64,
    total: u64,
    percentage: f32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct LocalModelInfo {
    name: String,
    size_bytes: u64,
    path: String,
}

struct LlamaProcess(Mutex<Option<Child>>);

#[tauri::command]
async fn download_model(
    window: Window,
    model_id: String,
    file_name: String,
    url: String,
) -> Result<(), String> {
    let app_dir = window
        .app_handle()
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");

    std::fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Не удалось создать папку: {}", e))?;

    let save_path = models_dir.join(&file_name);

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Ошибка запроса: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ошибка HTTP: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut file =
        File::create(&save_path).map_err(|e| format!("Ошибка создания файла: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Ошибка при чтении чанка: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Ошибка записи: {}", e))?;

        downloaded += chunk.len() as u64;

        let percentage = if total_size > 0 {
            (downloaded as f32 / total_size as f32) * 100.0
        } else {
            0.0
        };

        let _ = window.emit(
            "download-progress",
            DownloadProgress {
                model_id: model_id.clone(),
                file_name: file_name.clone(),
                downloaded,
                total: total_size,
                percentage,
            },
        );
    }

    Ok(())
}

#[tauri::command]
async fn list_local_models(window: Window) -> Result<Vec<LocalModelInfo>, String> {
    let app_dir = window
        .app_handle()
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");

    if !models_dir.exists() {
        let _ = std::fs::create_dir_all(&models_dir);
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(&models_dir).map_err(|e| e.to_string())?;
    let mut models = vec![];

    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "gguf" {
                        let name = path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();
                        let metadata = entry.metadata().map_err(|e| e.to_string())?;
                        models.push(LocalModelInfo {
                            name,
                            size_bytes: metadata.len(),
                            path: path.to_string_lossy().to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(models)
}

#[tauri::command]
async fn start_llama_server(
    state: tauri::State<'_, LlamaProcess>,
    model_path: String,
    port: Option<String>,
    threads: Option<String>,
    context_size: Option<String>,
    gpu_acceleration: Option<bool>,
) -> Result<String, String> {
    let mut child_guard = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = child_guard.take() {
        let _ = child.kill();
    }

    let server_port = port.unwrap_or_else(|| "8080".to_string());
    let server_threads = threads.unwrap_or_else(|| "8".to_string());
    let server_ctx = context_size.unwrap_or_else(|| "4096".to_string());
    let use_gpu = gpu_acceleration.unwrap_or(true);

    let mut cmd = Command::new("llama-server.exe");
    cmd.arg("-m")
        .arg(&model_path)
        .arg("--port")
        .arg(&server_port)
        .arg("-c")
        .arg(&server_ctx)
        .arg("-t")
        .arg(&server_threads);

    if use_gpu {
        cmd.arg("-ngl").arg("99");
    }

    let child = cmd.spawn().map_err(|e| {
        format!(
            "Не удалось запустить llama-server. Проверьте, доступен ли он в PATH: {}",
            e
        )
    })?;

    *child_guard = Some(child);

    Ok(format!("Сервер запущен с моделью: {}", model_path))
}

#[tauri::command]
async fn open_models_folder(window: Window) -> Result<(), String> {
    let app_dir = window
        .app_handle()
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");
    std::fs::create_dir_all(&models_dir).map_err(|e| format!("Не удалось создать папку: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(models_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(models_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(LlamaProcess(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            download_model,
            list_local_models,
            start_llama_server,
            open_models_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
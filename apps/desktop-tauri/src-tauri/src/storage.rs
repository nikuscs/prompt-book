use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptRecord {
    pub id: String,
    pub title: String,
    pub content: String,
    pub copied: u32,
    pub searched: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PromptIndexEntry {
    id: String,
    file: String,
    title: String,
    copied: u32,
    searched: u32,
    updated_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PromptIndex {
    version: u8,
    prompts: Vec<PromptIndexEntry>,
}

fn now_unix_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn storage_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
    Ok(PathBuf::from(home).join(".config").join("promptbook"))
}

fn index_path(base: &Path) -> PathBuf {
    base.join("index.json")
}

fn prompt_file_for(base: &Path, prompt_id: &str, title: &str) -> Option<PathBuf> {
    let index = read_index(base);
    if let Some(entry) = index.prompts.into_iter().find(|p| p.id == prompt_id) {
        let path = base.join(entry.file);
        if path.exists() {
            return Some(path);
        }
    }

    let fallback = base.join(format!("{}.md", slugify(title)));
    if fallback.exists() {
        Some(fallback)
    } else {
        None
    }
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let tmp = path.with_extension(format!(
        "{}.tmp",
        path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("file")
    ));
    {
        let mut file = fs::File::create(&tmp).map_err(|e| format!("create {:?}: {}", tmp, e))?;
        file.write_all(bytes)
            .map_err(|e| format!("write {:?}: {}", tmp, e))?;
        file.sync_all()
            .map_err(|e| format!("sync {:?}: {}", tmp, e))?;
    }
    fs::rename(&tmp, path).map_err(|e| format!("rename {:?} -> {:?}: {}", tmp, path, e))?;
    Ok(())
}

fn slugify(title: &str) -> String {
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
    let trimmed = out.trim_matches('-').to_string();
    if trimmed.is_empty() {
        "untitled".to_string()
    } else {
        trimmed.chars().take(80).collect()
    }
}

fn unslug(stem: &str) -> String {
    let mut s = stem.replace('-', " ");
    if let Some(first) = s.get_mut(0..1) {
        first.make_ascii_uppercase();
    }
    s
}

fn unique_filename(base_slug: &str, used: &mut HashSet<String>) -> String {
    let mut candidate = format!("{base_slug}.md");
    if used.insert(candidate.clone()) {
        return candidate;
    }
    let mut i = 2;
    loop {
        candidate = format!("{base_slug}-{i}.md");
        if used.insert(candidate.clone()) {
            return candidate;
        }
        i += 1;
    }
}

fn read_index(base: &Path) -> PromptIndex {
    let path = index_path(base);
    let raw = match fs::read_to_string(path) {
        Ok(v) => v,
        Err(_) => {
            return PromptIndex {
                version: 1,
                prompts: vec![],
            }
        }
    };
    serde_json::from_str(&raw).unwrap_or(PromptIndex {
        version: 1,
        prompts: vec![],
    })
}

pub fn load_prompts() -> Result<Vec<PromptRecord>, String> {
    let base = storage_dir()?;
    fs::create_dir_all(&base).map_err(|e| format!("create storage dir: {}", e))?;

    let index = read_index(&base);
    let mut by_file: HashMap<String, PromptIndexEntry> = HashMap::new();
    let mut order_by_file: HashMap<String, usize> = HashMap::new();
    for (idx, p) in index.prompts.into_iter().enumerate() {
        order_by_file.insert(p.file.clone(), idx);
        by_file.insert(p.file.clone(), p);
    }

    let mut files: Vec<String> = fs::read_dir(&base)
        .map_err(|e| format!("read dir: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let p = entry.path();
            if !p.is_file() {
                return None;
            }
            let file = p.file_name()?.to_str()?.to_string();
            if file == "index.json" || !file.ends_with(".md") {
                return None;
            }
            Some(file)
        })
        .collect();

    files.sort();
    files.sort_by_key(|f| order_by_file.get(f).copied().unwrap_or(usize::MAX));

    let mut out = vec![];
    for file in files {
        let path = base.join(&file);
        let content = fs::read_to_string(&path).unwrap_or_default();
        let stem = file.trim_end_matches(".md");
        if let Some(meta) = by_file.get(&file) {
            out.push(PromptRecord {
                id: meta.id.clone(),
                title: meta.title.clone(),
                content,
                copied: meta.copied,
                searched: meta.searched,
            });
        } else {
            out.push(PromptRecord {
                id: stem.to_string(),
                title: unslug(stem),
                content,
                copied: 0,
                searched: 0,
            });
        }
    }

    Ok(out)
}

pub fn save_prompts(prompts: Vec<PromptRecord>) -> Result<(), String> {
    let base = storage_dir()?;
    fs::create_dir_all(&base).map_err(|e| format!("create storage dir: {}", e))?;

    let existing_files: HashSet<String> = fs::read_dir(&base)
        .map_err(|e| format!("read dir: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter(|name| name.ends_with(".md"))
        .collect();

    let mut used_names = HashSet::new();
    let mut index_entries = vec![];
    let mut kept_files = HashSet::new();

    for prompt in prompts {
        let slug = slugify(&prompt.title);
        let file_name = unique_filename(&slug, &mut used_names);
        let file_path = base.join(&file_name);
        atomic_write(&file_path, prompt.content.as_bytes())?;
        kept_files.insert(file_name.clone());
        index_entries.push(PromptIndexEntry {
            id: prompt.id,
            file: file_name,
            title: prompt.title,
            copied: prompt.copied,
            searched: prompt.searched,
            updated_at: now_unix_secs(),
        });
    }

    for file in existing_files.difference(&kept_files) {
        let path = base.join(file);
        let _ = fs::remove_file(path);
    }

    let index = PromptIndex {
        version: 1,
        prompts: index_entries,
    };
    let json = serde_json::to_vec_pretty(&index).map_err(|e| format!("serialize index: {}", e))?;
    atomic_write(&index_path(&base), &json)?;
    Ok(())
}

pub fn get_prompt_path(prompt_id: &str, title: &str) -> Result<String, String> {
    let base = storage_dir()?;
    fs::create_dir_all(&base).map_err(|e| format!("create storage dir: {}", e))?;
    let Some(path) = prompt_file_for(&base, prompt_id, title) else {
        return Err("Prompt file not found yet. Try again after autosave.".to_string());
    };
    Ok(path.to_string_lossy().to_string())
}

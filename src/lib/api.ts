export async function fetchHfModels(query: string) {
  const res = await fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&limit=15`)
  const data = await res.json()
  if (Array.isArray(data)) {
    return data.map((m: any) => ({
      id: m._id || m.id,
      modelId: m.id,
      downloads: m.downloads || 0,
      likes: m.likes || 0,
    }))
  }
  return []
}
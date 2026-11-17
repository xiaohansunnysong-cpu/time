import { useEffect, useState } from "react"

import { loadPhoto } from "@/lib/storage"

export function usePhotoUrl(photoId?: string) {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null)

  useEffect(() => {
    if (!photoId) return
    let active = true
    let objectUrl: string | null = null
    void loadPhoto(photoId)
      .then((blob) => {
        if (!active || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ id: photoId, url: objectUrl })
      })
      .catch(() => {
        if (active) setLoaded(null)
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  if (!photoId || loaded?.id !== photoId) return null
  return loaded.url
}

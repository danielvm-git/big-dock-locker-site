import { ref, readonly } from 'vue'

interface Asset {
  name: string
  browser_download_url: string
  download_count: number
}

interface Release {
  tag: string
  silicon: string
  intel: string
  downloads: {
    silicon: number
    intel: number
    total: number
  }
}

const FALLBACK = 'https://github.com/danielvm-git/big-dock-locker/releases/latest'

const release = ref<Release | null>(null)
const loading = ref(false)
const error = ref(false)

export function useLatestRelease() {
  if (release.value || loading.value) {
    return { release: readonly(release), loading: readonly(loading), error: readonly(error) }
  }

  loading.value = true

  fetch('https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest')
    .then((r) => r.json())
    .then((data) => {
      const siliconAsset: Asset | undefined = data.assets?.find((a: Asset) =>
        a.name.includes('apple-silicon'),
      )
      const intelAsset: Asset | undefined = data.assets?.find((a: Asset) =>
        a.name.includes('intel'),
      )
      const siliconCount = siliconAsset?.download_count ?? 0
      const intelCount = intelAsset?.download_count ?? 0
      release.value = {
        tag: data.tag_name ?? '',
        silicon: siliconAsset?.browser_download_url ?? FALLBACK,
        intel: intelAsset?.browser_download_url ?? FALLBACK,
        downloads: {
          silicon: siliconCount,
          intel: intelCount,
          total: siliconCount + intelCount,
        },
      }
    })
    .catch(() => {
      error.value = true
    })
    .finally(() => {
      loading.value = false
    })

  return { release: readonly(release), loading: readonly(loading), error: readonly(error) }
}

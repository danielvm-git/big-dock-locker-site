import { ref, readonly } from 'vue'

interface Release {
  tag: string
  silicon: string
  intel: string
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
      const silicon = data.assets?.find((a: { name: string }) =>
        a.name.includes('apple-silicon'),
      )?.browser_download_url ?? FALLBACK
      const intel = data.assets?.find((a: { name: string }) =>
        a.name.includes('intel'),
      )?.browser_download_url ?? FALLBACK
      release.value = { tag: data.tag_name ?? '', silicon, intel }
    })
    .catch(() => {
      error.value = true
    })
    .finally(() => {
      loading.value = false
    })

  return { release: readonly(release), loading: readonly(loading), error: readonly(error) }
}

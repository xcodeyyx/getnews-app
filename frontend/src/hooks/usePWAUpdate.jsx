import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePWAUpdate() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (offlineReady) {
      console.log('App ready for offline use')
      // Bisa tambahkan notifikasi/toast di sini
    }
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, please refresh')
      // Bisa tambahkan dialog konfirmasi untuk update di sini
    }
  }, [needRefresh])

  return { offlineReady, needRefresh, updateServiceWorker }
}
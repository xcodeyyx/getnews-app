import { usePWAUpdate } from '../hooks/usePWAUpdate'

export function PWAPrompt() {
  const { offlineReady, needRefresh, updateServiceWorker } = usePWAUpdate()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="pwa-prompt">
      {/* <div className="pwa-message">
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click on reload button to update</span>
        )}
      </div> */}
      {needRefresh && (
        <button onClick={() => updateServiceWorker(true)}>Reload</button>
      )}
      <button onClick={close}>Close</button>
    </div>
  )
}
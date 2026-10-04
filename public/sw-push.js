// Web Push event listener for Service Worker
self.addEventListener('push', function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'Dinning Zone'
    const options = {
      body: data.body || 'Order status updated',
      icon: data.icon || '/brand/icon-192.png',
      badge: data.badge || '/brand/icon-192.png',
      tag: data.tag || 'order-update',
      data: {
        url: data.url || '/',
      },
      vibrate: [100, 50, 100],
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Error handling push notification event:', err)
  }
})

// Handle notification click -> focus existing window or open target URL
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

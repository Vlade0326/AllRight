self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'AllRight', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'AllRight', {
      body: data.body || '',
      icon: '/favicon.ico',
    }),
  );
});

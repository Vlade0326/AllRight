import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.allright.mobile',
  appName: 'AllRight',
  webDir: 'dist',
  server: {
    // Point the WebView at your API host in native builds (override via env at sync time).
    // For local LAN testing set CAPACITOR_SERVER_URL=https://192.168.x.x:3443
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Escaneando beacons…',
        cancel: 'Cancelar',
        availableServices: 'Servicios BLE',
        noDeviceFound: 'No se encontraron dispositivos',
      },
    },
  },
};

export default config;

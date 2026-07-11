# iOS Info.plist keys required for BLE (merge into ios/App/App/Info.plist after `npx cap add ios`)

NSBluetoothAlwaysUsageDescription = AllRight usa Bluetooth para detectar beacons de proximidad en interiores.
NSBluetoothPeripheralUsageDescription = AllRight usa Bluetooth para detectar beacons de proximidad en interiores.
NSLocationWhenInUseUsageDescription = AllRight usa la ubicación para geofence y complementar BLE en interiores.

# Android (android/app/src/main/AndroidManifest.xml) — plugin usually merges these:
# BLUETOOTH, BLUETOOTH_ADMIN, BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION

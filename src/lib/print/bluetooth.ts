"use client";

// Generic BLE thermal printer connector. Cheap ESC/POS printers don't share
// one standard GATT service UUID, so we discover the first writable
// characteristic on the paired device instead of hardcoding a vendor's UUID.
// TESTED ON REAL HARDWARE: not yet — verify against the actual printer
// during Phase 10 QA and adjust COMMON_SERVICES if discovery fails.

let device: BluetoothDevice | null = null;
let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

export function isSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function isConnected(): boolean {
  return !!characteristic && !!device?.gatt?.connected;
}

export function currentDeviceName(): string | null {
  return device?.name ?? null;
}

export async function connect(): Promise<void> {
  if (!isSupported()) throw new Error("Browser ini tidak mendukung Web Bluetooth (pakai Chrome di Android).");

  device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      0x18f0, 0xff00, 0xffe0, 0xffe5,
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      "000018f0-0000-1000-8000-00805f9b34fb",
    ],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error("Gagal konek ke printer");

  const services = await server.getPrimaryServices();
  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse,
    );
    if (writable) {
      characteristic = writable;
      break;
    }
  }

  if (!characteristic) {
    throw new Error("Printer tersambung tapi tidak ditemukan channel tulis (write characteristic).");
  }
}

export function disconnect(): void {
  device?.gatt?.disconnect();
  device = null;
  characteristic = null;
}

/** Sends raw ESC/POS bytes to the printer, chunked (BLE has a small MTU). */
export async function printBytes(bytes: Uint8Array): Promise<void> {
  if (!characteristic) throw new Error("Printer belum tersambung.");
  const CHUNK = 100;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.slice(i, i + CHUNK);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    // Small delay so slow BLE printers don't drop bytes under back-to-back writes.
    await new Promise((r) => setTimeout(r, 20));
  }
}

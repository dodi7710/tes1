/**
 * Shrinks a photo in the browser before upload (MENU-4): longest side capped
 * at `maxSide` px, re-encoded as WebP (JPEG where the browser can't encode
 * WebP). A phone photo of several MB comes out around 50–200 KB.
 */
export async function compressImage(file: File, maxSide = 800, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("File yang dipilih bukan gambar");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Foto tidak bisa dibaca. Coba foto lain (JPEG/PNG/WebP).");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pengolahan foto");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // WebP keeps transparency, so background-removed PNGs stay transparent.
  // Browsers that can't encode WebP silently fall back to PNG, so check the result type.
  let blob = await encode("image/webp");
  if (!blob || blob.type !== "image/webp") {
    // White backdrop so transparent PNGs don't turn black as JPEG.
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    blob = await encode("image/jpeg");
  }
  if (!blob) throw new Error("Gagal memproses foto");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `foto.${ext}`, { type: blob.type });
}

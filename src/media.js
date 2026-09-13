/** Raster uploads only. Keep the compressed result inside the free workspace budget. */
export async function readImage(file, maxChars = 80000) {
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (file.size > 12 * 1024 * 1024)
    throw new Error("A imagem deve ter no máximo 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    let dimension = 1200;
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = Math.min(
        1,
        dimension / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/webp", 0.8 - attempt * 0.07);
      if (result.length <= maxChars) return result;
      dimension *= 0.75;
    }
    throw new Error(
      "Não foi possível compactar esta imagem. Escolha um arquivo menor.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

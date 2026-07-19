/* ============================================================================
 * IMAGEM — comprime as fotos ANTES de guardar.
 *
 * Uma foto do iPhone tem 3–5 MB. Quatro por registro, vinte registros ao longo
 * dos 90 dias: 400 MB. Isso estoura a cota do navegador e torna o backup
 * impossível de compartilhar. Reduzimos para o lado maior de 1280 px em JPEG
 * 0.72, o que dá ~120–200 KB por foto sem perda visual relevante para
 * comparação corporal.
 *
 * Tudo acontece no aparelho. Nenhum byte sai daqui.
 * ========================================================================== */

export const MAX_LADO = 1280;
export const QUALIDADE = 0.72;

/** Converte um File/Blob em data URL JPEG comprimido. */
export function comprimirImagem(file, { maxLado = MAX_LADO, qualidade = QUALIDADE } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/'))
      return reject(new Error('O arquivo escolhido não é uma imagem.'));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let { width: w, height: h } = img;
        const escala = Math.min(1, maxLado / Math.max(w, h));
        w = Math.round(w * escala);
        h = Math.round(h * escala);

        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      } catch (err) {
        reject(new Error('Não consegui processar esta imagem.'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não consegui abrir esta imagem.'));
    };
    img.src = url;
  });
}

/** Tamanho aproximado de um data URL, em KB. */
export const tamanhoKB = dataURL =>
  dataURL ? Math.round((dataURL.length * 3 / 4) / 1024) : 0;

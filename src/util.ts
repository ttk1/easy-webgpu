export function fetchImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      // 後でテクスチャを読みだす際に一行のバイト数が256の倍数になっている必要があるため
      // ここで画像データの幅を64の倍数にリサイズするしておく
      // ref: https://www.w3.org/TR/webgpu/#dom-gpuimagedatalayout-bytesperrow
      const width = Math.ceil(img.width / 64) * 64;
      cvs.width = width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      if (ctx == null) {
        throw new Error('画像の読み込みに失敗しました');
      }
      ctx.drawImage(img, 0, 0, width, img.height);
      resolve(ctx.getImageData(0, 0, width, img.height));
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function fetchText(src: string): Promise<string> {
  return fetch(src).then(res => res.text());
}

export function preprocessText(text: string): string[] {
  const lines: string[] = [];
  text.replace(/\r/g, '').split('\n').forEach(line => {
    // 余計なスペースを除去
    line = line.replace(/\s+/g, ' ').replace(/(^\s|\s$)/g, '');
    // 空の行を削除
    if (line == '') {
      return;
    }
    // コメント行を削除
    if (line.startsWith('#')) {
      return;
    }
    lines.push(line);
  });
  return lines;
}

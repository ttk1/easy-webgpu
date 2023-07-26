import { fetchText } from './util';

export type Obj = {
  v: number[][];
  vn: number[][];
  vt: number[][];
  f: number[][][];
};

export async function loadObj(objUrl: string/*, mtlUrl: string | null, textureImageUrl: string | null*/): Promise<Obj> {
  const text = await fetchText(objUrl);
  const lines = text.replace(/\r/g, '').split('\n');

  const v: number[][] = [];
  const vn: number[][] = [];
  const vt: number[][] = [];
  const f: number[][][] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // 余計なスペースを除去
    line = line.replace(/\s+/g, ' ').replace(/(^\s|\s$)/g, '');
    // 空の行を削除
    if (line == '') {
      continue;
    }
    // コメント行を削除
    if (line.startsWith('#')) {
      continue;
    }
    // 処理
    const terms = line.split(' ');
    if (terms[0] == 'v') {
      v.push([Number(terms[1]), Number(terms[2]), Number(terms[3])]);
    } else if (terms[0] == 'vn') {
      vn.push([Number(terms[1]), Number(terms[2]), Number(terms[3])]);
    } else if (terms[0] == 'vt') {
      vt.push([Number(terms[1]), Number(terms[2]), Number(terms[3])]);
    } else if (terms[0] == 'f') {
      const ff: number[][] = [];
      f.push(ff);
      for (let j = 1; j < terms.length; j++) {
        const vertex = terms[j].split('/');
        ff.push([Number(vertex[0]), Number(vertex[1]), Number(vertex[2])]);
      }
    }
  }
  return {
    v: v,
    vn: vn,
    vt: vt,
    f: f
  };
}

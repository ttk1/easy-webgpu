import { fetchText, preprocessText } from './util';

export type MyObject = {
  f: number[][][];
  mtlName: string | null;
};

export type Obj = {
  v: number[][];
  vn: number[][];
  vt: number[][];
  objects: MyObject[];
  materials: Mtl[];
};

export type Mtl = {
  name: string | null;
  mapKd: string | null;
};

async function loadMtl(mtlUrl: string): Promise<Mtl[]> {
  const text = await fetchText(mtlUrl);
  const lines = preprocessText(text);

  const mtls: Mtl[] = [];
  let mtlName: string | null = null;
  let mtlMapKd: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const terms = lines[i].split(' ');
    if (terms[0] == 'newmtl') {
      if (mtlName != null && mtlMapKd != null) {
        mtls.push({
          name: mtlName,
          mapKd: mtlMapKd
        });
      }
      mtlName = terms[1];
      mtlMapKd = null;
    } else if (terms[0] == 'map_Kd') {
      mtlMapKd = mtlUrl.replace(/\/[^/]*$/, '/' + terms[1]);
    }
  }

  mtls.push({
    name: mtlName,
    mapKd: mtlMapKd
  });

  return mtls;
}

export async function loadObj(objUrl: string): Promise<Obj> {
  const text = await fetchText(objUrl);
  const lines = preprocessText(text);

  const v: number[][] = [];
  const vn: number[][] = [];
  const vt: number[][] = [];
  const objects: MyObject[] = [];
  const materials: Mtl[] = [];

  let f: number[][][] = [];
  let mtlName: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const terms = lines[i].split(' ');
    if (terms[0] == 'usemtl') {
      if (mtlName != null) {
        objects.push({
          f: f,
          mtlName: mtlName
        });
      }
      f = [];
      mtlName = terms[1];
    } else if (terms[0] == 'v') {
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
    } else if (terms[0] == 'mtllib') {
      materials.push(...(await loadMtl(objUrl.replace(/\/[^/]*$/, '/' + terms[1]))));
    }
  }

  objects.push({
    f: f,
    mtlName: mtlName
  });

  return {
    v: v,
    vn: vn,
    vt: vt,
    objects: objects,
    materials: materials
  };
}

import { Face } from '../face';
import { Vec2, Vec3 } from '../vector';
import { InstancedMesh } from './instancedMesh';

export class InstancedCustomMesh implements InstancedMesh {
  private v: number[][] = [];
  private vn: number[][] = [];
  private vt: number[][] = [];
  private f: number[][][] = [];
  private vertices: number[];
  private normals: number[];
  private uvCoords: number[];
  private textureImages: ImageData[];
  private vertexCount: number;

  public constructor(v: number[][], vn: number[][], vt: number[][], f: number[][][]) {
    this.v = v;
    this.vn = vn;
    this.vt = vt;
    this.f = f;
    this.vertices = [];
    this.normals = [];
    this.uvCoords = [];
    this.textureImages = [];
    this.vertexCount = 0;

    this.f.forEach(face => {
      const vertices: Vec3[] = [];
      const normals: Vec3[] = [];
      const uvCoords: Vec2[] = [];

      face.forEach(vertex => {
        const v = this.v[vertex[0] - 1];
        vertices.push(new Vec3(v[0], v[1], v[2]));

        const vt = this.vt[vertex[1] - 1];
        uvCoords.push(new Vec2(vt[0], vt[1]));

        const vn = this.vn[vertex[2] - 1];
        normals.push(new Vec3(vn[0], vn[1], vn[2]));
      });

      this.addFace(vertices, uvCoords, normals);
    });
  }

  private addFace(vertices: Vec3[], uvCoords: Vec2[], normals: Vec3[]) {
    for (let i = 1; i < vertices.length - 1; i++) {
      this.addTriangle(
        vertices[0], vertices[i],vertices[i + 1],
        normals[0], normals[i], normals[i + 1],
        uvCoords[0], uvCoords[i], uvCoords[i + 1]
      );
    }
  }

  private addTriangle(v1: Vec3, v2: Vec3, v3: Vec3, n1: Vec3, n2: Vec3, n3: Vec3, uv1: Vec2, uv2: Vec2, uv3: Vec2) {
    // v1
    this.addVertex(v1);
    this.addNormal(n1);
    this.addUVCoord(uv1);
    // v2
    this.addVertex(v2);
    this.addNormal(n2);
    this.addUVCoord(uv2);
    // v3
    this.addVertex(v3);
    this.addNormal(n3);
    this.addUVCoord(uv3);

    this.vertexCount += 3;
  }

  private addVertex(vertex: Vec3) {
    this.vertices.push(vertex.x, vertex.y, vertex.z);
  }

  private addNormal(normal: Vec3) {
    this.normals.push(normal.x, normal.y, normal.z);
  }

  private addUVCoord(uvCoord: Vec2) {
    this.uvCoords.push(uvCoord.x, 1 - uvCoord.y);
  }

  public getVertices(): number[] {
    return this.vertices;
  }
  public getNormals(): number[] {
    return this.normals;
  }
  public getUVCoords(): number[] {
    return this.uvCoords;
  }
  public getOffsets(): number[] {
    return this.getVertices();
  }

  public setTextureImages(textureImages: ImageData[]): void {
    this.textureImages = textureImages;
  }

  public getTextureImages(): ImageData[] {
    const arr: ImageData[] = [];
    this.textureImages.forEach((textureImage) => {
      arr.push(textureImage);
    });
    return arr;
  }

  public getInstancePositions(): number[] {
    return [0, 20, 0];
  }

  public getInstanceRotations(): number[] {
    return [Face.TOP];
  }

  public getInstanceTextureIds(): number[] {
    return [0];
  }

  public getInstanceCount(): number {
    return 1;
  }

  public getVertexCount(): number {
    return this.vertexCount;
  }
}

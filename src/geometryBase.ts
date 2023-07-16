import { Vec2, Vec3 } from './vector';

export class GeometryBase {
  private vertices: number[];
  private normals: number[];
  private uvCoords: number[];

  public constructor() {
    this.vertices = [];
    this.normals = [];
    this.uvCoords = [];
  }

  /**
   * 与えられた頂点から構成される多角形を追加する。
   * 頂点は表面から見て反時計回りで指定しなければならない。
   * @param vertices 多角形を構成する頂点
   * @param uvCoords 頂点に対応する UV 座標
   */
  public addFace(vertices: Vec3[], uvCoords?: Vec2[]) {
    if (vertices == null || vertices.length < 3) {
      throw new Error('頂点が３つ以上必要です');
    }
    if (uvCoords != null && vertices.length != uvCoords.length) {
      throw new Error('頂点の数と UV 座標の数が一致しません');
    }
    for (let i = 1; i < vertices.length - 1; i++) {
      if (uvCoords != null) {
        this.addTriangle(vertices[0], vertices[i], vertices[i + 1], uvCoords[0], uvCoords[i], uvCoords[i + 1]);
      } else {
        // uvCoords が無い場合は (0, 0) を入れておく
        this.addTriangle(vertices[0], vertices[i], vertices[i + 1], new Vec2(0, 0), new Vec2(0, 0), new Vec2(0, 0));
      }
    }
  }

  /**
   * v1 ~ v3 からなる三角形面を追加する。
   * 頂点は表面から見て反時計回りで指定しなければならない。
   * @param v1
   * @param v2
   * @param v3
   * @param uv1
   * @param uv2
   * @param uv3
   */
  private addTriangle(v1: Vec3, v2: Vec3, v3: Vec3, uv1: Vec2, uv2: Vec2, uv3: Vec2) {
    // 面法線ベクトルを法線ベクトルとして使う
    const surfaceNormal = this.getSurfaceNormal(v1, v2, v3);
    // v1
    this.addVertex(v1);
    this.addUVCoord(uv1);
    this.addNormal(surfaceNormal);
    // v2
    this.addVertex(v2);
    this.addUVCoord(uv2);
    this.addNormal(surfaceNormal);
    // v3
    this.addVertex(v3);
    this.addUVCoord(uv3);
    this.addNormal(surfaceNormal);
  }

  /**
   * v1 ~ v3 からなる三角形面の面法線ベクトルを返す。
   * 頂点は表面から見て反時計回りで指定しなければならない。
   * @param v1
   * @param v2
   * @param v3
   * @returns 面法線ベクトル
   */
  private getSurfaceNormal(v1: Vec3, v2: Vec3, v3: Vec3): Vec3 {
    const a = new Vec3(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
    const b = new Vec3(v3.x - v1.x, v3.y - v1.y, v3.z - v1.z);
    // 外積
    return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }

  /**
   * 法線ベクトルを追加する。
   * @param normal 法線ベクトル
   */
  private addNormal(normal: Vec3) {
    this.normals.push(normal.x, normal.y, normal.z);
  }

  private addVertex(vertex: Vec3) {
    this.vertices.push(vertex.x, vertex.y, vertex.z);
  }

  /**
   * UV 座標を追加する。
   * @param uvCoord UV 座標
   */
  public addUVCoord(uvCoord: Vec2) {
    this.uvCoords.push(uvCoord.x, uvCoord.y);
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
}

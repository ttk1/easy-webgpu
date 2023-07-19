import { Face } from '../face';
import { GeometryBase } from '../geometryBase';
import { Vec2, Vec3 } from '../vector';
import { InstancedMesh } from './instancedMesh';

/**
 * Cube のインスタンス化バージョン
 *
 */
export class InstancedCube extends GeometryBase implements InstancedMesh {
  private textureImages: ImageData[];
  private instancePositions: Vec3[];
  private instanceRotations: number[];
  private instanceTextureIds: number[];

  public constructor() {
    super();
    this.textureImages = [];
    this.instancePositions = [];
    this.instanceRotations = [];
    this.instanceTextureIds = [];

    // 頂点の位置関係:
    //   B------C
    //  /|     /|
    // A------D |
    // | F----|-G
    // |/     |/
    // E------H
    //
    // 上: y+, 下: y-
    // 前: z+, 奥: z-
    // 右: x+, 左: x-
    const A = new Vec3(-0.5, 0.5, 0.5);
    const B = new Vec3(-0.5, 0.5, -0.5);
    const C = new Vec3(0.5, 0.5, -0.5);
    const D = new Vec3(0.5, 0.5, 0.5);
    const E = new Vec3(-0.5, -0.5, 0.5);
    const F = new Vec3(-0.5, -0.5, -0.5);
    const G = new Vec3(0.5, -0.5, -0.5);
    const H = new Vec3(0.5, -0.5, 0.5);

    // 背面カリングのために、反時計回りで統一している
    // 上面
    this.addFace([A, D, C, B], [
      new Vec2(1 / 4, 1 / 3),
      new Vec2(2 / 4, 1 / 3),
      new Vec2(2 / 4, 0 / 3),
      new Vec2(1 / 4, 0 / 3)
    ]);
    // 底面
    this.addFace([E, F, G, H], [
      new Vec2(1 / 4, 2 / 3),
      new Vec2(1 / 4, 3 / 3),
      new Vec2(2 / 4, 3 / 3),
      new Vec2(2 / 4, 2 / 3)
    ]);
    // 左面
    this.addFace([A, B, F, E], [
      new Vec2(1 / 4, 1 / 3),
      new Vec2(0 / 4, 1 / 3),
      new Vec2(0 / 4, 2 / 3),
      new Vec2(1 / 4, 2 / 3)
    ]);
    // 右面
    this.addFace([D, H, G, C], [
      new Vec2(2 / 4, 1 / 3),
      new Vec2(2 / 4, 2 / 3),
      new Vec2(3 / 4, 2 / 3),
      new Vec2(3 / 4, 1 / 3)
    ]);
    // 前面
    this.addFace([A, E, H, D], [
      new Vec2(1 / 4, 1 / 3),
      new Vec2(1 / 4, 2 / 3),
      new Vec2(2 / 4, 2 / 3),
      new Vec2(2 / 4, 1 / 3)
    ]);
    // 奥面
    this.addFace([B, C, G, F], [
      new Vec2(4 / 4, 1 / 3),
      new Vec2(3 / 4, 1 / 3),
      new Vec2(3 / 4, 2 / 3),
      new Vec2(4 / 4, 2 / 3)
    ]);
  }

  public getOffsets(): number[] {
    return this.getVertices();
  }

  /**
   * インスタンスを追加する
   * @param position インスタンスの位置
   * @param textureId テクスチャの ID
   * @param face インスタンスの向き（デフォルト手前が南）
   */
  public addInstance(position: Vec3, textureId: number, face = Face.SOUTH): void {
    this.instancePositions.push(position);
    this.instanceTextureIds.push(textureId);
    this.instanceRotations.push(face);
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
    const arr: number[] = [];
    this.instancePositions.forEach((instancePosition) => {
      arr.push(...instancePosition.toArray());
    });
    return arr;
  }

  public getInstanceRotations(): number[] {
    const arr: number[] = [];
    this.instanceRotations.forEach((instanceRotation) => {
      arr.push(instanceRotation);
    });
    return arr;
  }

  public getInstanceTextureIds(): number[] {
    const arr: number[] = [];
    this.instanceTextureIds.forEach((instanceTextureId) => {
      arr.push(instanceTextureId);
    });
    return arr;
  }

  public getInstanceCount(): number {
    return this.instancePositions.length;
  }

  public getVertexCount(): number {
    return this.getVertices().length / 3;
  }
}

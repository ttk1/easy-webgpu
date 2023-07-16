import { Face } from '../face';
import { GeometryBase } from '../geometryBase';
import { Vec2, Vec3 } from '../vector';
import { InstancedMesh } from './instancedMesh';

/**
 * Square のインスタンス化バージョン
 */
export class InstancedSquare extends GeometryBase implements InstancedMesh {
  private textureImages: HTMLImageElement[];
  private textureWidth: number;
  private textureHeight: number;
  private instancePositions: Vec3[];
  private instanceRotations: number[];
  private instanceTextureIds: number[];

  public constructor() {
    super();
    this.textureImages = [];
    this.textureWidth = 512;
    this.textureHeight = 512;
    this.instancePositions = [];
    this.instanceRotations = [];
    this.instanceTextureIds = [];

    // 頂点の位置関係:
    // A------B
    // |      |
    // |      |
    // D------C
    const A = new Vec3(-0.5, 0.5, 0.5);
    const B = new Vec3(0.5, 0.5, 0.5);
    const C = new Vec3(0.5, -0.5, 0.5);
    const D = new Vec3(-0.5, -0.5, 0.5);

    // UV マッピング
    // UL (0, 0) -- UR (1, 0)
    //      |            |
    //      |            |
    // LL (0, 1) -- LR (1, 1)
    const UL = new Vec2(0, 0);
    const UR = new Vec2(1, 0);
    const LL = new Vec2(0, 1);
    const LR = new Vec2(1, 1);

    // 背面カリングのために、反時計回りで統一している
    this.addFace([A, D, C, B], [UL, LL, LR, UR]);
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

  public setTextureImages(textureImages: HTMLImageElement[], width = 512, height = 512): void {
    this.textureWidth = width;
    this.textureHeight = height;
    this.textureImages = textureImages;
  }

  public getTextureImages(): HTMLImageElement[] {
    const arr: HTMLImageElement[] = [];
    this.textureImages.forEach((textureImage) => {
      arr.push(textureImage);
    });
    return arr;
  }

  public getTextureWidth(): number {
    return this.textureWidth;
  }

  public getTextureHeight(): number {
    return this.textureHeight;
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
    this.instanceRotations.forEach((instanceRotations) => {
      arr.push(instanceRotations);
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

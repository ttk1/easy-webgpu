/**
 * インスタンシング版 Mesh
 * 一旦細かい機能を省いた版で定義
 */
export interface InstancedMesh {
  /**
   * 基準点からの相対位置を表わす頂点の座標の配列を返す
   * @returns メッシュの頂点配列
   */
  getOffsets(): number[];

  /**
   * 各頂点の法線ベクトルを返す（オフセットに入ってる順に返される）
   * @returns 法線ベクトルの配列
   */
  getNormals(): number[];

  /**
   * 各頂点の UV 座標を返す
   * @returns UV 座標の配列
   */
  getUVCoords(): number[];

  /**
   * インスタンスの位置の配列を返す
   * @returns インスタンスの位置の配列
   */
  getInstancePositions(): number[];

  /**
   * インスタンスの向きの配列を返す
   * @returns インスタンスの向きの配列
   */
  getInstanceRotations(): number[];

  /**
   * インスタンスの textureId の配列を返す
   * @returns インスタンスの textureId の配列
   */
  getInstanceTextureIds(): number[];

  /**
   * TODO: ここに置くのがよい？
   * @returns テクスチャの配列, textureId の順番で格納されている
   */
  getTextureImages(): HTMLImageElement[];

  /**
   * テクスチャの幅を返す
   */
  getTextureWidth(): number;

  /**
   * テクスチャの高さを返す
   */
  getTextureHeight(): number;

  /**
   * インスタンスの数を返す
   * @returns インスタンスの数
   */
  getInstanceCount(): number;

  /**
   * 頂点数を返す
   * @returns 頂点数
   */
  getVertexCount(): number;
}

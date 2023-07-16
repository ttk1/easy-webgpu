import { Matrix } from './matrix';
import { Vec3 } from './vector';

export interface Camera {
  position: Vec3;
  rotation: Vec3;
  move(motion: Vec3): void;
  rotate(rotation: Vec3): void;
  getViewMatrix(): Matrix;
  getProjectionMatrix(): Matrix;
}

/**
 * 透視投影カメラ
 */
export class PerspectiveCamera implements Camera {
  public position: Vec3;
  public rotation: Vec3;
  public fov: number;
  public aspect: number;
  public near: number;
  public far: number;

  /**
   * @param potition カメラの位置
   * @param rotation カメラ注視点・回転（オイラー角）, X -> Y の順に回転（一旦Zは無視するようにしてる）
   * @param fov 視野角, 単位はラジアン
   * @param aspect 画面の縦横比, w/h
   * @param near near planeまでの距離
   * @param far far planeまでの距離
   */
  public constructor(potition: Vec3, rotation: Vec3, fov: number, aspect: number, near: number, far: number) {
    this.position = potition;
    this.rotation = rotation;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  private getRotateMatrix(): Matrix {
    return new Matrix(4, 4, [
      1, 0, 0, 0,
      0, Math.cos(this.rotation.x), Math.sin(this.rotation.x), 0,
      0, - Math.sin(this.rotation.x), Math.cos(this.rotation.x), 0,
      0, 0, 0, 1
    ]).mul(new Matrix(4, 4, [
      Math.cos(this.rotation.y), 0, - Math.sin(this.rotation.y), 0,
      0, 1, 0, 0,
      Math.sin(this.rotation.y), 0, Math.cos(this.rotation.y), 0,
      0, 0, 0, 1
    ]));
  }

  private getTranslateMatrix(): Matrix {
    return new Matrix(4, 4, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      - this.position.x, - this.position.y, - this.position.z, 1
    ]);
  }

  /**
   * 移動時に視点の高さに関わらず水平方向へ移動したいので、
   * x 方向の回転（ピッチ）は 0 で計算する
   */
  private getInvRotateMatrixForMove(): Matrix {
    return new Matrix(4, 4, [
      Math.cos(- this.rotation.y), 0, - Math.sin(- this.rotation.y), 0,
      0, 1, 0, 0,
      Math.sin(- this.rotation.y), 0, Math.cos(- this.rotation.y), 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * カメラの位置を移動する
   * @param motion 移動ベクトル
   */
  public move(motion: Vec3): void {
    const converted = this.getInvRotateMatrixForMove().mul(new Matrix(4, 1, [
      motion.x,
      motion.y,
      motion.z,
      0
    ]));
    this.position.x += converted.getValue(0, 0);
    this.position.y += converted.getValue(1, 0);
    this.position.z += converted.getValue(2, 0);
  }

  /**
   * カメラの向きを回転する。
   * 垂直方向（x）の回転は [- PI / 2, + PI / 2] の範囲に制限する。
   * @param rotation カメラ注視点・回転（オイラー角）, X -> Y の順に回転（一旦Zは無視するようにしてる）
   */
  public rotate(rotation: Vec3): void {
    this.rotation.x = Math.min(Math.max(this.rotation.x + rotation.x, - Math.PI / 2), Math.PI / 2);
    this.rotation.y = (this.rotation.y + rotation.y) % (2 * Math.PI);
  }

  /**
   * ビュー変換行列を返す
   */
  public getViewMatrix(): Matrix {
    return this.getRotateMatrix().mul(this.getTranslateMatrix());
  }

  /**
   * 投影変換行列を返す
   */
  public getProjectionMatrix(): Matrix {
    return new Matrix(4, 4, [
      1 / (this.aspect * Math.tan(this.fov / 2)), 0, 0, 0,
      0, 1 / Math.tan(this.fov / 2), 0, 0,
      0, 0, - (this.far + this.near) / (this.far - this.near), -1,
      0, 0, - 2 * this.far * this.near / (this.far - this.near), 0
    ]);
  }
}

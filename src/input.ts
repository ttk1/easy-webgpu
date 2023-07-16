import { Camera, PerspectiveCamera } from './camera';
import { Vec3 } from './vector';

// キーマップ設定
const KEY_LEFT = 'KeyA';
const KEY_RIGHT = 'KeyD';
const KEY_FRONT = 'KeyW';
const KEY_BACK = 'KeyS';
const KEY_UP = 'Space';
const KEY_DOWN = 'ShiftLeft';

export class FPSKeyboard {
  private L = 0; // A
  private R = 0; // D
  private F = 0; // W
  private B = 0; // S
  private U = 0; // SPC
  private D = 0; // SFT

  public constructor(window: Window) {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case KEY_LEFT:
          this.L = 1;
          break;
        case KEY_RIGHT:
          this.R = 1;
          break;
        case KEY_FRONT:
          this.F = 1;
          break;
        case KEY_BACK:
          this.B = 1;
          break;
        case KEY_UP:
          this.U = 1;
          break;
        case KEY_DOWN:
          this.D = 1;
          break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case KEY_LEFT:
          this.L = 0;
          break;
        case KEY_RIGHT:
          this.R = 0;
          break;
        case KEY_FRONT:
          this.F = 0;
          break;
        case KEY_BACK:
          this.B = 0;
          break;
        case KEY_UP:
          this.U = 0;
          break;
        case KEY_DOWN:
          this.D = 0;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, false);
    window.addEventListener('keyup', handleKeyUp, false);
  }

  public getLR(): number {
    return this.R - this.L;
  }

  public getUD(): number {
    return this.U - this.D;
  }

  public getFB(): number {
    return this.B - this.F;
  }
}

export class FPSMouse {
  private lastMovementX = 0;
  private lastMovementY = 0;

  public constructor(window: Window, camera: Camera, sensitivity?: number) {
    // 感度のデフォルト値設定
    if (sensitivity == null) {
      sensitivity = 0.003;
    }
    const handleMouseMove = (event: MouseEvent) => {
      // マウスによっては値がたまに跳ねてカメラの方向が急に変わってしまう場合があるので
      // 前回の値も踏まえ調整する
      if (Math.abs(this.lastMovementX) < 15 && Math.abs(event.movementX) > 50 ||
        Math.abs(this.lastMovementY) < 15 && Math.abs(event.movementY) > 50) {
        return;
      }
      // 前回の値を更新
      this.lastMovementX = event.movementX;
      this.lastMovementY = event.movementY;

      // オイラー角でやるので縦方向が x であることに注意
      // キャンバスは縦方向が y なのでここで入れ替えている
      // ここにカメラのインスタンスの処理を入れたくないが。。。とりあえずこの実装で
      camera.rotate(new Vec3(
        event.movementY * sensitivity,
        event.movementX * sensitivity,
        0
      ));
    };
    window.addEventListener('mousemove', handleMouseMove, false);
  }
}

export function wheelZoom(camera: PerspectiveCamera): void {
  const handleWheel = (event: WheelEvent) => {
    // 30 ~ 110 の範囲で設定する
    camera.fov = Math.max((30 / 180) * Math.PI,
      Math.min((110 / 180) * Math.PI,
        camera.fov + event.deltaY * 0.001));
  };
  window.addEventListener('wheel', handleWheel, false);
}

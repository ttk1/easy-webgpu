import { PerspectiveCamera } from './camera';
import { FPSKeyboard, FPSMouse, wheelZoom } from './input';
import { Light } from './light';
import { InstancedCube } from './mesh/instancedCube';
import { InstancedSquare } from './mesh/instancedSquare';
import { Renderer } from './renderer';
import { Scene } from './scene';
import { fetchImage } from './util';
import { Vec3 } from './vector';

/**
 * Example
 */

window.onload = async () => {
  ////////// 諸々準備 //////////

  // GPUDevice の取得
  const cvs = document.body.appendChild(document.createElement('canvas'));
  cvs.width = 1000;
  cvs.height = 500;
  const ctx = cvs.getContext('webgpu');
  if (ctx == null) {
    return;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (adapter == null) {
    return;
  }
  const device = await adapter.requestDevice();

  // 情報表示
  const info = document.body.appendChild(document.createElement('pre'));

  // camera
  const camera = new PerspectiveCamera(
    new Vec3(0, 0, 10), // pos
    new Vec3(0, 0, 0),  // rot
    (70 / 180) * Math.PI, // fov
    cvs.width / cvs.height, // aspect, w/h
    0.5, // near
    100 // far
  );

  // scene
  const scene = new Scene();

  // light
  scene.addLight(new Light(1, 2, 3));
  scene.addLight(new Light(-1, -2, -3));

  // mesh
  // とりあえずランダムな位置に何個か適当に出す
  function randomCoord(): number {
    return Math.floor(Math.random() * 10);
  }

  const mesh1 = new InstancedCube();
  mesh1.setTextureImages([
    await fetchImage('./texture/dice.png')
  ], 256, 192);
  scene.addMesh(mesh1);
  for (let i = 0; i < 100; i++) {
    mesh1.addInstance(new Vec3(
      randomCoord(),
      randomCoord(),
      randomCoord()
    ), 0, Math.floor(Math.random() * 6));
  }

  const mesh2 = new InstancedCube();
  mesh2.setTextureImages([
    await fetchImage('./texture/dice2.png')
  ], 256, 192);
  scene.addMesh(mesh2);
  for (let i = 0; i < 100; i++) {
    mesh2.addInstance(new Vec3(
      randomCoord() + 10,
      randomCoord() + 10,
      randomCoord() + 10
    ), 0);
  }

  // square 版
  const mesh3 = new InstancedSquare();
  mesh3.setTextureImages([
    await fetchImage('./texture/white.png'),
    await fetchImage('./texture/yellow.png')
  ], 64, 64);
  scene.addMesh(mesh3);
  for (let i = 0; i < 100; i++) {
    mesh3.addInstance(new Vec3(
      randomCoord() - 10,
      randomCoord() - 10,
      randomCoord() - 10
    ), Math.floor(Math.random() * 2), Math.floor(Math.random() * 6));
  }

  // renderer
  const renderer = new Renderer(ctx, device);

  ////////// ループ部分 //////////

  // キー・マウス入力処理
  const keyboard = new FPSKeyboard(window);
  new FPSMouse(window, camera);
  wheelZoom(camera);

  // パラメータ回り
  let requestId: number | null = null;
  let lastTimestamp = 0;

  // カメラの移動速度
  let vLR = 0;
  let vUD = 0;
  let vFB = 0;
  function getCamVel(pv: number, cv: number) {
    // 加速度無しの場合は cv をそのまま返す
    // return cv;

    if (cv == 0 || pv * cv < 0) {
      return 0;
    } else if (pv <= -1 || pv >= 1) {
      return pv;
    } else {
      return pv + 0.05 * cv;
    }
  }

  // アニメーション処理
  const step = async (timestamp: number) => {
    const timeGap = timestamp - (lastTimestamp || timestamp);
    lastTimestamp = timestamp;

    /*** 描画処理ここから ***/

    // カメラの位置を更新
    vLR = getCamVel(vLR, keyboard.getLR());
    vUD = getCamVel(vUD, keyboard.getUD());
    vFB = getCamVel(vFB, keyboard.getFB());
    camera.move(new Vec3(
      vLR * timeGap / 50,
      vUD * timeGap / 50,
      vFB * timeGap / 50
    ));

    // 描画
    renderer.render(scene, camera);

    // 情報表示
    info.textContent = `FPS: ${1 / timeGap * 1000}
cameraPosX: ${camera.position.x}
cameraPosY: ${camera.position.y}
cameraPosZ: ${camera.position.z}
cameraRotX: ${camera.rotation.x}
cameraRotY: ${camera.rotation.y}
cameraRotZ: ${camera.rotation.z}
cameraFov: ${camera.fov}`;

    /*** 描画処理ここまで ***/

    requestId = requestAnimationFrame(step);
  };

  // ポインタロックまわりの処理
  // とりあえず雑に実装
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement == null) {
      if (requestId != null) {
        cancelAnimationFrame(requestId);
      }
    } else {
      lastTimestamp = performance.now();
      requestId = requestAnimationFrame(step);
    }
  }, false);
  document.addEventListener('click', () => {
    document.body.requestPointerLock();
  }, false);
};

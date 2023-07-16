import { Light } from './light';
import { InstancedMesh } from './mesh/instancedMesh';

export class Scene {
  private meshes: InstancedMesh[];
  private lights: Light[];

  public constructor();
  public constructor(meshes: InstancedMesh[], lights: Light[]);
  public constructor(meshes?: InstancedMesh[], lights?: Light[]) {
    if (meshes != null) {
      this.meshes = meshes;
    } else {
      this.meshes = [];
    }
    if (lights != null) {
      this.lights = lights;
    } else {
      this.lights = [];
    }
  }

  public getLights(): Light[] {
    return this.lights;
  }

  public getMeshes(): InstancedMesh[] {
    return this.meshes;
  }

  /**
   * シーンにメッシュを追加する
   * @param mesh 追加するメッシュ
   */
  public addMesh(mesh: InstancedMesh): void {
    if (this.meshes.indexOf(mesh) < 0) {
      this.meshes.push(mesh);
    }
  }

  /**
   * シーンからメッシュを取り除く
   * @param mesh 取り除くメッシュ
   */
  public removeMesh(mesh: InstancedMesh): void {
    const idx = this.meshes.indexOf(mesh);
    if (idx >= 0) {
      this.meshes.splice(idx, 1);
    }
  }

  /**
   * シーンにライトを追加する
   * @param light 追加するライト
   */
  public addLight(light: Light): void {
    if (this.lights.indexOf(light) < 0) {
      this.lights.push(light);
    }
  }

  /**
   * シーンからライトを取り除く
   * @param light 取り除くライト
   */
  public removeLight(light: Light): void {
    const idx = this.lights.indexOf(light);
    if (idx >= 0) {
      this.lights.splice(idx, 1);
    }
  }
}

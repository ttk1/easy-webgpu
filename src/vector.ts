export class Vec2 {
  public x: number;
  public y: number;

  public constructor(x :number, y: number) {
    this.x = x;
    this.y = y;
  }

  public toArray(): number[] {
    return [this.x, this.y];
  }
}

export class Vec3 {
  public x: number;
  public y: number;
  public z: number;

  public constructor(x :number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public toArray(): number[] {
    return [this.x, this.y, this.z];
  }
}

export class Vec4 {
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  public constructor(x :number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  public toArray(): number[] {
    return [this.x, this.y, this.z, this.w];
  }
}

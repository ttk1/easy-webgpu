export default `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) diffuse: f32,
  @location(1) @interpolate(flat) textureId: u32,
  @location(2) uv : vec2f
}

@group(0) @binding(0) var<uniform> numLights: u32;
@group(0) @binding(1) var<uniform> lights: array<vec3f, 20>;
@group(0) @binding(2) var<uniform> view: mat4x4f;
@group(0) @binding(3) var<uniform> projection: mat4x4f;
@group(0) @binding(4) var mySampler: sampler;
@group(0) @binding(5) var myTexture: texture_2d_array<f32>;

var<private> model = array<mat4x4f, 6>(
  // T = (-pi/2, 0)
  mat4x4f(1.0, 0.0, 0.0, 0.0,
      0.0, 0.0, -1.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 1.0),
  // B = (pi/2, 0)
  mat4x4f(1.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, -1.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 1.0),
  // S = (0, 0)
  mat4x4f(1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0),
  // N = (0, pi)
  mat4x4f(-1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, -1.0, 0.0,
      0.0, 0.0, 0.0, 1.0),
  // E = (0, pi/2)
  mat4x4f(0.0, 0.0, -1.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      1.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 1.0),
  // W = (0, -pi/2)
  mat4x4f(0.0, 0.0, 1.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 1.0)
);

@vertex
fn vertex_main(
  @location(0) offset: vec3f,
  @location(1) normal: vec3f,
  @location(2) position: vec3f,
  @location(3) rotation: u32,
  @location(4) uv: vec2f,
  @location(5) textureId: u32
) -> VertexOut {
  var out: VertexOut;
  out.position = projection * view * (vec4f(position, 1.0) + model[rotation] * vec4f(offset, 1.0));

  // ライティング
  // TODO: 環境光によるライティング
  var diffuse = 0.0;
  for (var i = 0u; i < numLights; i++) {
    diffuse += max(0.0, - dot(model[rotation] * vec4f(normalize(normal), 0.0), vec4f(normalize(lights[i]), 0.0)));
  }
  out.diffuse = diffuse;

  out.textureId = textureId;
  out.uv = uv;
  return out;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
  return vec4f(fragData.diffuse * textureSample(myTexture, mySampler, fragData.uv, fragData.textureId).rgb, 1.0);
}
`;
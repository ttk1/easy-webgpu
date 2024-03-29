import { Camera } from './camera';
import { Scene } from './scene';
import shader from './shader.wgsl';
import { InstancedMesh } from './mesh/instancedMesh';

const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

export class Renderer {
  private ctx: GPUCanvasContext;
  private device: GPUDevice;
  private depthTexture: GPUTexture;
  private renderPipeline: GPURenderPipeline;
  private sampler: GPUSampler;
  private numLightsBuffer: GPUBuffer;
  private lightsBuffer: GPUBuffer;
  private viewBuffer: GPUBuffer;
  private projectionBuffer: GPUBuffer;
  private bindings: Map<InstancedMesh, {
    bindGroup: GPUBindGroup,
    offsets: GPUBuffer,
    normals: GPUBuffer,
    positions: GPUBuffer,
    rotations: GPUBuffer,
    uvs: GPUBuffer,
    textureIds: GPUBuffer
  }>;

  public constructor(ctx: GPUCanvasContext, device: GPUDevice) {
    this.ctx = ctx;
    this.device = device;

    ctx.configure({
      device: device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied'
    });

    // キャンバスサイズを可変にする場合は、render() 内でやった方がいいかも？
    this.depthTexture = device.createTexture({
      size: [ctx.canvas.width, ctx.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    // とりあえず、シェーダーは固定にする
    const shaderModule = device.createShaderModule({
      code: shader
    });
    const vertexBuffers: GPUVertexBufferLayout[] = [
      {
        // offset
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3'
          },
        ],
        arrayStride: 4 * 3,
        stepMode: 'vertex'
      },
      {
        // normal
        attributes: [
          {
            shaderLocation: 1,
            offset: 0,
            format: 'float32x3'
          },
        ],
        arrayStride: 4 * 3,
        stepMode: 'vertex'
      },
      {
        // position
        attributes: [
          {
            shaderLocation: 2,
            offset: 0,
            format: 'float32x3'
          },
        ],
        arrayStride: 4 * 3,
        stepMode: 'instance'
      },
      {
        // rotation
        attributes: [
          {
            shaderLocation: 3,
            offset: 0,
            format: 'uint32'
          },
        ],
        arrayStride: 4,
        stepMode: 'instance'
      },
      {
        // uv
        attributes: [
          {
            shaderLocation: 4,
            offset: 0,
            format: 'float32x2'
          },
        ],
        arrayStride: 4 * 2,
        stepMode: 'vertex'
      },
      {
        // textureId
        attributes: [
          {
            shaderLocation: 5,
            offset: 0,
            format: 'uint32'
          },
        ],
        arrayStride: 4,
        stepMode: 'instance'
      }
    ];
    const pipelineDescriptor: GPURenderPipelineDescriptor = {
      vertex: {
        module: shaderModule,
        entryPoint: 'vertex_main',
        buffers: vertexBuffers
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragment_main',
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          }
        ]
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
      },
      layout: 'auto',
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    };
    this.renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    this.numLightsBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.lightsBuffer = this.device.createBuffer({
      // アライメントの都合で 4*4 とする
      size: 4 * 4 * 20,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.viewBuffer = this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.projectionBuffer = this.device.createBuffer({
      size: 16 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.bindings = new Map();
  }

  /**
   * シーンを描画する
   * @param scene 描画対象のシーン
   * @param camera 描画に使うカメラ
   */
  public render(scene: Scene, camera: Camera): void {
    const commandEncoder = this.device.createCommandEncoder();

    // uniform データの作成
    const lights = scene.getLights();
    const lightsData = new Float32Array(lights.flatMap((light) => {
      // アライメントの都合で最後に0を追加する
      return [light.getX(), light.getY(), light.getZ(), 0];
    }));
    const numLights = new Uint32Array([lights.length]);
    const view = new Float32Array(camera.getViewMatrix().toArray());
    const projection = new Float32Array(camera.getProjectionMatrix().toArray());

    this.device.queue.writeBuffer(this.numLightsBuffer, 0, numLights, 0, numLights.length);
    this.device.queue.writeBuffer(this.lightsBuffer, 0, lightsData, 0, lightsData.length);
    this.device.queue.writeBuffer(this.viewBuffer, 0, view, 0, view.length);
    this.device.queue.writeBuffer(this.projectionBuffer, 0, projection, 0, projection.length);

    // clear
    commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: 'clear',
          storeOp: 'store',
          view: this.ctx.getCurrentTexture().createView()
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    }).end();

    scene.getMeshes().forEach((mesh) => {
      let binding = this.bindings.get(mesh);
      if (binding == null) {
        const textureImages = mesh.getTextureImages();
        // 一つ目の width と height を使用
        const textureWidth = textureImages[0].width;
        const textureHeight = textureImages[0].height;
        const textureCount = textureImages.length;
        const texture = this.device.createTexture({
          size: [
            textureWidth,
            textureHeight,
            // layer が 1 だと texture_2d_array として扱われないので、
            // 2以上の値になるようにする
            Math.max(textureCount, 2)
          ],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
        });
        const textureBuffer = this.device.createBuffer({
          size: textureWidth * textureHeight * textureCount * 4,
          usage: GPUBufferUsage.COPY_SRC,
          mappedAtCreation: true
        });
        const pixelData = new Uint8Array(textureBuffer.getMappedRange());
        textureImages.forEach((textureImage, idx) => {
          pixelData.set(textureImage.data, textureWidth * textureHeight * idx * 4);
        });
        textureBuffer.unmap();

        // TODO: テクスチャの幅が 64 ピクセル（256 バイト）じゃないと読み込めない問題なんとかしたい
        // bytesPerRow (64) is not a multiple of 256.
        commandEncoder.copyBufferToTexture(
          {
            buffer: textureBuffer,
            bytesPerRow: textureWidth * 4,
            rowsPerImage: textureHeight
          },
          {
            texture: texture
          },
          {
            width: textureWidth,
            height: textureHeight,
            depthOrArrayLayers: textureCount
          }
        );

        const bindGroup = this.device.createBindGroup({
          layout: this.renderPipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: {
                buffer: this.numLightsBuffer
              },
            },
            {
              binding: 1,
              resource: {
                buffer: this.lightsBuffer
              },
            },
            {
              binding: 2,
              resource: {
                buffer: this.viewBuffer
              },
            },
            {
              binding: 3,
              resource: {
                buffer: this.projectionBuffer
              },
            },
            {
              binding: 4,
              resource: this.sampler
            },
            {
              binding: 5,
              resource: texture.createView()
            }
          ]
        });

        // 一旦更新されないものとする
        // offset
        const offsets = new Float32Array(mesh.getOffsets());
        const offsetBuffer = this.device.createBuffer({
          size: offsets.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(offsetBuffer, 0, offsets, 0, offsets.length);
        // normal
        const normals = new Float32Array(mesh.getNormals());
        const normalBuffer = this.device.createBuffer({
          size: normals.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(normalBuffer, 0, normals, 0, normals.length);
        // potition
        const positions = new Float32Array(mesh.getInstancePositions());
        const positionBuffer = this.device.createBuffer({
          size: positions.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(positionBuffer, 0, positions, 0, positions.length);
        // rotation
        const rotations = new Uint32Array(mesh.getInstanceRotations());
        const rotationBuffer = this.device.createBuffer({
          size: rotations.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(rotationBuffer, 0, rotations, 0, rotations.length);
        // uv
        const uvs = new Float32Array(mesh.getUVCoords());
        const uvBuffer = this.device.createBuffer({
          size: uvs.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(uvBuffer, 0, uvs, 0, uvs.length);
        // textureId
        const textureIds = new Uint32Array(mesh.getInstanceTextureIds());
        const textureIdBuffer = this.device.createBuffer({
          size: textureIds.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(textureIdBuffer, 0, textureIds, 0, textureIds.length);
        binding = {
          bindGroup: bindGroup,
          offsets: offsetBuffer,
          normals: normalBuffer,
          positions: positionBuffer,
          rotations: rotationBuffer,
          uvs: uvBuffer,
          textureIds: textureIdBuffer
        };
        this.bindings.set(mesh, binding);
      }
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            loadOp: 'load',
            storeOp: 'store',
            view: this.ctx.getCurrentTexture().createView()
          },
        ],
        depthStencilAttachment: {
          view: this.depthTexture.createView(),
          depthLoadOp: 'load',
          depthStoreOp: 'store'
        }
      });
      renderPass.setPipeline(this.renderPipeline);
      renderPass.setBindGroup(0, binding.bindGroup);
      renderPass.setVertexBuffer(0, binding.offsets);
      renderPass.setVertexBuffer(1, binding.normals);
      renderPass.setVertexBuffer(2, binding.positions);
      renderPass.setVertexBuffer(3, binding.rotations);
      renderPass.setVertexBuffer(4, binding.uvs);
      renderPass.setVertexBuffer(5, binding.textureIds);
      renderPass.draw(mesh.getVertexCount(), mesh.getInstanceCount());
      renderPass.end();
    });
    this.device.queue.submit([commandEncoder.finish()]);
  }
}

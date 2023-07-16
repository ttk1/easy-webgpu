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
  private bindings: Map<InstancedMesh, {
    bindGroup: GPUBindGroup,
    numLights: GPUBuffer,
    lights: GPUBuffer,
    view: GPUBuffer,
    projection: GPUBuffer,
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
    const lightsData = new Float32Array(lights.flatMap((light) =>{
      // アライメントの都合で最後に0を追加する
      return [light.getX(), light.getY(), light.getZ(), 0];
    }));
    const numLights = new Uint32Array([lights.length]);
    const view = new Float32Array(camera.getViewMatrix().toArray());
    const projection = new Float32Array(camera.getProjectionMatrix().toArray());

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
      if (!this.bindings.has(mesh)) {
        const textureImages = mesh.getTextureImages();
        const textureWidth = mesh.getTextureWidth();
        const textureHeight = mesh.getTextureHeight();
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
        const cvs = document.createElement('canvas');
        textureImages.forEach((textureImage, idx) => {
          cvs.width = textureWidth;
          cvs.height = textureHeight;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(textureImage, 0, 0);
          pixelData.set(ctx.getImageData(0, 0, textureWidth, textureHeight).data, textureWidth * textureHeight * idx * 4);
        });
        textureBuffer.unmap();

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

        const numLightsBuffer = this.device.createBuffer({
          size: 4,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const lightsBuffer = this.device.createBuffer({
          // アライメントの都合で 4*4 とする
          size: 4 * 4 * 20,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const viewBuffer = this.device.createBuffer({
          size: 16 * 4,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const projectionBuffer = this.device.createBuffer({
          size: 16 * 4,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        const bindGroup = this.device.createBindGroup({
          layout: this.renderPipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: {
                buffer: numLightsBuffer
              },
            },
            {
              binding: 1,
              resource: {
                buffer: lightsBuffer
              },
            },
            {
              binding: 2,
              resource: {
                buffer: viewBuffer
              },
            },
            {
              binding: 3,
              resource: {
                buffer: projectionBuffer
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

        this.bindings.set(mesh, {
          bindGroup: bindGroup,
          numLights: numLightsBuffer,
          lights: lightsBuffer,
          view: viewBuffer,
          projection: projectionBuffer,
          offsets: offsetBuffer,
          normals: normalBuffer,
          positions: positionBuffer,
          rotations: rotationBuffer,
          uvs: uvBuffer,
          textureIds: textureIdBuffer
        });
      }

      const bindings = this.bindings.get(mesh);
      this.device.queue.writeBuffer(bindings.numLights, 0, numLights, 0, numLights.length);
      this.device.queue.writeBuffer(bindings.lights, 0, lightsData, 0, lightsData.length);
      this.device.queue.writeBuffer(bindings.view, 0, view, 0, view.length);
      this.device.queue.writeBuffer(bindings.projection, 0, projection, 0, projection.length);

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
      renderPass.setBindGroup(0, bindings.bindGroup);
      renderPass.setVertexBuffer(0, bindings.offsets);
      renderPass.setVertexBuffer(1, bindings.normals);
      renderPass.setVertexBuffer(2, bindings.positions);
      renderPass.setVertexBuffer(3, bindings.rotations);
      renderPass.setVertexBuffer(4, bindings.uvs);
      renderPass.setVertexBuffer(5, bindings.textureIds);
      renderPass.draw(mesh.getVertexCount(), mesh.getInstanceCount());
      renderPass.end();
    });
    this.device.queue.submit([commandEncoder.finish()]);
  }
}

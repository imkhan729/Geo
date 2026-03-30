import React, { useRef, useEffect } from 'react';

const FluidCursorEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  const config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1440,
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    TRANSPARENT: true,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | WebGL2RenderingContext;
    let ext: any;
    const pointers = [{
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: { r: 0, g: 0, b: 0 },
    }];
    let dye: any, velocity: any, divergence: any, curlFBO: any, pressureFBO: any;
    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;
    let copyProgram: any, clearProgram: any, splatProgram: any, advectionProgram: any;
    let divergenceProgram: any, curlProgram: any, vorticityProgram: any, pressureProgram: any;
    let gradienSubtractProgram: any, displayMaterial: any;
    let blit: any;

    const initializeWebGL = () => {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      gl = (canvas.getContext('webgl2', params) ||
             canvas.getContext('webgl', params) ||
             canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext;

      if (!gl) throw new Error('Unable to initialize WebGL.');

      const isWebGL2 = 'drawBuffers' in gl;
      let supportLinearFiltering = false;
      let halfFloat: any = null;

      if (isWebGL2) {
        (gl as WebGL2RenderingContext).getExtension('EXT_color_buffer_float');
        supportLinearFiltering = !!(gl as WebGL2RenderingContext).getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
      }

      gl.clearColor(0, 0, 0, 1);
      const halfFloatTexType = isWebGL2
        ? (gl as WebGL2RenderingContext).HALF_FLOAT
        : (halfFloat && halfFloat.HALF_FLOAT_OES) || 0;

      let formatRGBA, formatRG, formatR;
      if (isWebGL2) {
        const gl2 = gl as WebGL2RenderingContext;
        formatRGBA = getSupportedFormat(gl, gl2.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl2.RG16F, (gl2 as any).RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl2.R16F, (gl2 as any).RED, halfFloatTexType);
      } else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      }

      ext = { formatRGBA, formatRG, formatR, halfFloatTexType, supportLinearFiltering };
      if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
      }
    };

    const getSupportedFormat = (gl: any, internalFormat: any, format: any, type: any): any => {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        if ('drawBuffers' in gl) {
          const gl2 = gl as WebGL2RenderingContext;
          switch (internalFormat) {
            case gl2.R16F: return getSupportedFormat(gl, gl2.RG16F, (gl2 as any).RG, type);
            case gl2.RG16F: return getSupportedFormat(gl, gl2.RGBA16F, gl.RGBA, type);
            default: return null;
          }
        }
        return null;
      }
      return { internalFormat, format };
    };

    const supportRenderTextureFormat = (gl: any, internalFormat: any, format: any, type: any) => {
      const texture = gl.createTexture();
      if (!texture) return false;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      if (!fbo) return false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    };

    const compileShader = (type: number, source: string, keywords: string[] | null = null) => {
      let shaderSource = source;
      if (keywords) {
        shaderSource = keywords.map(k => `#define ${k}\n`).join('') + source;
      }
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const createProgram = (vertexShader: WebGLShader | null, fragmentShader: WebGLShader | null) => {
      if (!vertexShader || !fragmentShader) return null;
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
      }
      return program;
    };

    const getUniforms = (program: WebGLProgram) => {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
      return uniforms;
    };

    class GLProgram {
      program: WebGLProgram | null;
      uniforms: Record<string, WebGLUniformLocation | null>;
      constructor(vs: WebGLShader | null, fs: WebGLShader | null) {
        this.program = createProgram(vs, fs);
        this.uniforms = this.program ? getUniforms(this.program) : {};
      }
      bind() { if (this.program) gl.useProgram(this.program); }
    }

    class Material {
      vertexShader: WebGLShader | null;
      fragmentShaderSource: string;
      programs: Record<number, WebGLProgram | null>;
      activeProgram: WebGLProgram | null;
      uniforms: Record<string, WebGLUniformLocation | null>;
      constructor(vs: WebGLShader | null, fsSrc: string) {
        this.vertexShader = vs;
        this.fragmentShaderSource = fsSrc;
        this.programs = {};
        this.activeProgram = null;
        this.uniforms = {};
      }
      setKeywords(keywords: string[]) {
        let hash = 0;
        for (const kw of keywords) hash += this.hashCode(kw);
        if (!this.programs[hash]) {
          const fs = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          this.programs[hash] = createProgram(this.vertexShader, fs);
        }
        const program = this.programs[hash];
        if (program === this.activeProgram) return;
        if (program) this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }
      hashCode(s: string) {
        let hash = 0;
        for (let i = 0; i < s.length; i++) { hash = (hash << 5) - hash + s.charCodeAt(i); hash |= 0; }
        return hash;
      }
      bind() { if (this.activeProgram) gl.useProgram(this.activeProgram); }
    }

    const initializeShaders = () => {
      const baseVS = compileShader(gl.VERTEX_SHADER, `
        precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
        uniform vec2 texelSize;
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0); vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y); vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }`);

      const copyFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture;
        void main () { gl_FragColor = texture2D(uTexture, vUv); }`);

      const clearFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
        void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`);

      const displayFSSrc = `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
        uniform sampler2D uTexture; uniform vec2 texelSize;
        vec3 linearToGamma (vec3 color) {
          color = max(color, vec3(0));
          return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }
        void main () {
          vec3 c = texture2D(uTexture, vUv).rgb;
          #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb; vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb; vec3 bc = texture2D(uTexture, vB).rgb;
            float dx = length(rc) - length(lc); float dy = length(tc) - length(bc);
            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            float diffuse = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);
            c *= diffuse;
          #endif
          float a = max(c.r, max(c.g, c.b));
          gl_FragColor = vec4(c, a);
        }`;

      const splatFS = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
        uniform vec3 color; uniform vec2 point; uniform float radius;
        void main () {
          vec2 p = vUv - point.xy; p.x *= aspectRatio;
          vec3 splat = exp(-dot(p, p) / radius) * color;
          gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
        }`);

      const advectionFS = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
        uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5; vec2 iuv = floor(st); vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
          #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
          #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
          #endif
          gl_FragColor = result / (1.0 + dissipation * dt);
        }`, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);

      const divergenceFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
        varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;
          float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;
          vec2 C = texture2D(uVelocity, vUv).xy;
          if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; }
          if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; }
          gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
        }`);

      const curlFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
        varying highp vec2 vT; varying highp vec2 vB; uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;
          float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;
          gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
        }`);

      const vorticityFS = compileShader(gl.FRAGMENT_SHADER, `
        precision highp float; precision highp sampler2D;
        varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
        uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
        void main () {
          float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;
          float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x;
          float C = texture2D(uCurl, vUv).x;
          vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
          force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;
          vec2 v = texture2D(uVelocity, vUv).xy + force * dt;
          gl_FragColor = vec4(min(max(v, -1000.0), 1000.0), 0.0, 1.0);
        }`);

      const pressureFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
        varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uPressure; uniform sampler2D uDivergence;
        void main () {
          float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
          float divergence = texture2D(uDivergence, vUv).x;
          gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
        }`);

      const gradSubFS = compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float; precision mediump sampler2D;
        varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR;
        varying highp vec2 vT; varying highp vec2 vB;
        uniform sampler2D uPressure; uniform sampler2D uVelocity;
        void main () {
          float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
          float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
          vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0.0, 1.0);
        }`);

      copyProgram = new GLProgram(baseVS, copyFS);
      clearProgram = new GLProgram(baseVS, clearFS);
      splatProgram = new GLProgram(baseVS, splatFS);
      advectionProgram = new GLProgram(baseVS, advectionFS);
      divergenceProgram = new GLProgram(baseVS, divergenceFS);
      curlProgram = new GLProgram(baseVS, curlFS);
      vorticityProgram = new GLProgram(baseVS, vorticityFS);
      pressureProgram = new GLProgram(baseVS, pressureFS);
      gradienSubtractProgram = new GLProgram(baseVS, gradSubFS);
      displayMaterial = new Material(baseVS, displayFSSrc);
    };

    const initializeBlit = () => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      const elemBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      blit = (target: any, doClear = false) => {
        if (!gl) return;
        if (!target) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (doClear) { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    };

    const createFBO = (w: number, h: number, internalFormat: any, format: any, type: any, param: any) => {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        }
      };
    };

    const createDoubleFBO = (w: number, h: number, iF: any, f: any, t: any, p: any) => {
      let fbo1 = createFBO(w, h, iF, f, t, p);
      let fbo2 = createFBO(w, h, iF, f, t, p);
      return {
        width: w, height: h,
        texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        read: fbo1, write: fbo2,
        swap() { const tmp = this.read; this.read = this.write; this.write = tmp; }
      };
    };

    const getResolution = (resolution: number) => {
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const aspect = (w / h) < 1 ? h / w : w / h;
      const min = Math.round(resolution), max = Math.round(resolution * aspect);
      return w > h ? { width: max, height: min } : { width: min, height: max };
    };

    const scaleByPixelRatio = (input: number) => Math.floor(input * (window.devicePixelRatio || 1));

    const initFramebuffers = () => {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      if (!dye) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      if (!velocity) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressureFBO = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    };

    const HSVtoRGB = (h: number, s: number, v: number) => {
      const i = Math.floor(h * 6), f = h * 6 - i;
      const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      let r = 0, g = 0, b = 0;
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
      }
      return { r, g, b };
    };

    // Green-biased color generation matching site theme (#2D6A4F forest green)
    const generateColor = () => {
      const h = 0.28 + Math.random() * 0.18; // green to teal range (100°–163°)
      const c = HSVtoRGB(h, 0.85 + Math.random() * 0.15, 1.0);
      c.r *= 0.15; c.g *= 0.15; c.b *= 0.15;
      return c;
    };

    const wrap = (value: number, min: number, max: number) => {
      const range = max - min;
      return range === 0 ? min : ((value - min) % range) + min;
    };

    const calcDeltaTime = () => {
      const now = Date.now();
      const dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;
      return dt;
    };

    const resizeCanvas = () => {
      const w = scaleByPixelRatio(canvas.clientWidth), h = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
      return false;
    };

    const updateColors = (dt: number) => {
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
        pointers.forEach(p => { p.color = generateColor(); });
      }
    };

    const applyInputs = () => {
      pointers.forEach(p => { if (p.moved) { p.moved = false; splatPointer(p); } });
    };

    const step = (dt: number) => {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      if (curlProgram.uniforms.texelSize) gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (curlProgram.uniforms.uVelocity) gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      if (vorticityProgram.uniforms.texelSize) gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (vorticityProgram.uniforms.uVelocity) gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      if (vorticityProgram.uniforms.uCurl) gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
      if (vorticityProgram.uniforms.curl) gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      if (vorticityProgram.uniforms.dt) gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write); velocity.swap();

      divergenceProgram.bind();
      if (divergenceProgram.uniforms.texelSize) gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (divergenceProgram.uniforms.uVelocity) gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      if (clearProgram.uniforms.uTexture) gl.uniform1i(clearProgram.uniforms.uTexture, pressureFBO.read.attach(0));
      if (clearProgram.uniforms.value) gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressureFBO.write); pressureFBO.swap();

      pressureProgram.bind();
      if (pressureProgram.uniforms.texelSize) gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (pressureProgram.uniforms.uDivergence) gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        if (pressureProgram.uniforms.uPressure) gl.uniform1i(pressureProgram.uniforms.uPressure, pressureFBO.read.attach(1));
        blit(pressureFBO.write); pressureFBO.swap();
      }

      gradienSubtractProgram.bind();
      if (gradienSubtractProgram.uniforms.texelSize) gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (gradienSubtractProgram.uniforms.uPressure) gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressureFBO.read.attach(0));
      if (gradienSubtractProgram.uniforms.uVelocity) gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write); velocity.swap();

      advectionProgram.bind();
      if (advectionProgram.uniforms.texelSize) gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      const velId = velocity.read.attach(0);
      if (advectionProgram.uniforms.uVelocity) gl.uniform1i(advectionProgram.uniforms.uVelocity, velId);
      if (advectionProgram.uniforms.uSource) gl.uniform1i(advectionProgram.uniforms.uSource, velId);
      if (advectionProgram.uniforms.dt) gl.uniform1f(advectionProgram.uniforms.dt, dt);
      if (advectionProgram.uniforms.dissipation) gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write); velocity.swap();

      if (!ext.supportLinearFiltering && advectionProgram.uniforms.dyeTexelSize) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      if (advectionProgram.uniforms.uVelocity) gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      if (advectionProgram.uniforms.uSource) gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      if (advectionProgram.uniforms.dissipation) gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write); dye.swap();
    };

    const render = () => {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
      displayMaterial.bind();
      if (config.SHADING && displayMaterial.uniforms.texelSize) gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
      if (displayMaterial.uniforms.uTexture) gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(null, false);
    };

    const splatPointer = (pointer: typeof pointers[0]) => {
      const dx = pointer.deltaX * config.SPLAT_FORCE;
      const dy = pointer.deltaY * config.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    };

    const clickSplat = (pointer: typeof pointers[0]) => {
      const color = generateColor();
      color.r *= 10; color.g *= 10; color.b *= 10;
      splat(pointer.texcoordX, pointer.texcoordY, 10 * (Math.random() - 0.5), 30 * (Math.random() - 0.5), color);
    };

    const splat = (x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) => {
      splatProgram.bind();
      if (splatProgram.uniforms.uTarget) gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      if (splatProgram.uniforms.aspectRatio) gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      if (splatProgram.uniforms.point) gl.uniform2f(splatProgram.uniforms.point, x, y);
      if (splatProgram.uniforms.color) gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      if (splatProgram.uniforms.radius) gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100));
      blit(velocity.write); velocity.swap();

      if (splatProgram.uniforms.uTarget) gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      if (splatProgram.uniforms.color) gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write); dye.swap();
    };

    const correctRadius = (radius: number) => {
      const ar = canvas.width / canvas.height;
      return ar > 1 ? radius * ar : radius;
    };
    const correctDeltaX = (d: number) => { const ar = canvas.width / canvas.height; return ar < 1 ? d * ar : d; };
    const correctDeltaY = (d: number) => { const ar = canvas.width / canvas.height; return ar > 1 ? d / ar : d; };

    const updatePointerDown = (pointer: typeof pointers[0], posX: number, posY: number) => {
      pointer.down = true; pointer.moved = false;
      pointer.texcoordX = posX / canvas.width; pointer.texcoordY = 1 - posY / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX; pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0; pointer.deltaY = 0;
      pointer.color = generateColor();
    };

    const updatePointerMove = (pointer: typeof pointers[0], posX: number, posY: number) => {
      pointer.prevTexcoordX = pointer.texcoordX; pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width; pointer.texcoordY = 1 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    };

    const updateFrame = () => {
      const dt = calcDeltaTime();
      if (resizeCanvas()) initFramebuffers();
      updateColors(dt);
      applyInputs();
      step(dt);
      render();
      animationIdRef.current = requestAnimationFrame(updateFrame);
    };

    const setupEventListeners = () => {
      const onMouseDown = (e: MouseEvent) => {
        const p = pointers[0];
        updatePointerDown(p, scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY));
        clickSplat(p);
      };
      const onMouseMove = (e: MouseEvent) => {
        updatePointerMove(pointers[0], scaleByPixelRatio(e.clientX), scaleByPixelRatio(e.clientY));
      };
      const onTouchStart = (e: TouchEvent) => {
        const t = e.targetTouches[0];
        updatePointerDown(pointers[0], scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY));
      };
      const onTouchMove = (e: TouchEvent) => {
        const t = e.targetTouches[0];
        updatePointerMove(pointers[0], scaleByPixelRatio(t.clientX), scaleByPixelRatio(t.clientY));
      };
      const onTouchEnd = () => { pointers[0].down = false; };

      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchstart', onTouchStart, false);
      window.addEventListener('touchmove', onTouchMove, false);
      window.addEventListener('touchend', onTouchEnd);

      return () => {
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    };

    let cleanupListeners: (() => void) | null = null;
    try {
      initializeWebGL();
      initializeShaders();
      initializeBlit();
      displayMaterial.setKeywords(config.SHADING ? ['SHADING'] : []);
      initFramebuffers();
      cleanupListeners = setupEventListeners();
      updateFrame();
    } catch (err) {
      console.warn('Fluid cursor effect unavailable:', err);
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (cleanupListeners) cleanupListeners();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
};

export default FluidCursorEffect;

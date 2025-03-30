var ot=Object.defineProperty;var nt=(e,r,t)=>r in e?ot(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var p=(e,r,t)=>(nt(e,typeof r!="symbol"?r+"":r,t),t);import"./modulepreload-polyfill-3cfb730f.js";const s={SIM_RESOLUTION:128,DYE_RESOLUTION:1024,CAPTURE_RESOLUTION:512,DENSITY_DISSIPATION:.5,VELOCITY_DISSIPATION:.1,PRESSURE:.2,PRESSURE_ITERATIONS:20,CURL:5,SPLAT_RADIUS:.25,SPLAT_FORCE:6e3,SHADING:!0,COLORFUL:!0,COLOR_UPDATE_SPEED:10,PAUSED:!1,BACK_COLOR:{r:0,g:0,b:0},TRANSPARENT:!1,BLOOM:!1,BLOOM_ITERATIONS:8,BLOOM_RESOLUTION:256,BLOOM_INTENSITY:.1,BLOOM_THRESHOLD:.6,BLOOM_SOFT_KNEE:.7,SUNRAYS:!0,SUNRAYS_RESOLUTION:196,SUNRAYS_WEIGHT:.5,MIRROR_MODE:!1,SPLAT_SPEED:1e3,SPLAT_COUNT:5,SHOW_DEBUG:!1};class P{constructor(){p(this,"id");p(this,"texcoordX");p(this,"texcoordY");p(this,"prevTexcoordX");p(this,"prevTexcoordY");p(this,"deltaX");p(this,"deltaY");p(this,"down");p(this,"moved");p(this,"color");this.id=-1,this.texcoordX=0,this.texcoordY=0,this.prevTexcoordX=0,this.prevTexcoordY=0,this.deltaX=0,this.deltaY=0,this.down=!1,this.moved=!1,this.color={r:30,g:0,b:300}}}let O=[],X=[];O.push(new P);function _e(){return/Mobi|Android/i.test(navigator.userAgent)}function z(e,r){let t=e.drawingBufferWidth/e.drawingBufferHeight;t<1&&(t=1/t);let n=Math.round(r),o=Math.round(r*t);return e.drawingBufferWidth>e.drawingBufferHeight?{width:o,height:n}:{width:n,height:o}}function y(e){let r=window.devicePixelRatio||1;return Math.floor(e*r)}function it(e){const r={alpha:!0,depth:!1,stencil:!1,antialias:!1,preserveDrawingBuffer:!1};let t=e.getContext("webgl2",r);const n=!!t;if(n||(t=e.getContext("webgl",r)||e.getContext("experimental-webgl",r)),!t)throw new Error("WebGL not supported");let o,i;n?(t.getExtension("EXT_color_buffer_float"),i=t.getExtension("OES_texture_float_linear")):(o=t.getExtension("OES_texture_half_float"),i=t.getExtension("OES_texture_half_float_linear")),t.clearColor(0,0,0,1);const a=n?t.HALF_FLOAT:o.HALF_FLOAT_OES;let d=M(t,n?t.RGBA16F:t.RGBA,t.RGBA,a);d||(d={internalFormat:t.RGBA,format:t.RGBA});const f=d;let c=M(t,n?t.RG16F:t.RGBA,n?t.RG:t.RGBA,a);c||(c={internalFormat:t.RGBA,format:t.RGBA});const l=c;let v=M(t,n?t.R16F:t.RGBA,n?t.RED:t.RGBA,a);return v||(v={internalFormat:t.RGBA,format:t.RGBA}),{gl:t,ext:{formatRGBA:f,formatRG:l,formatR:v,halfFloatTexType:a,supportLinearFiltering:i}}}function M(e,r,t,n){if(!at(e,r,t,n))switch(r){case e.R16F:return M(e,e.RG16F,e.RG,n);case e.RG16F:return M(e,e.RGBA16F,e.RGBA,n);default:return null}return{internalFormat:r,format:t}}function at(e,r,t,n){let o=e.createTexture();e.bindTexture(e.TEXTURE_2D,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,r,4,4,0,t,n,null);let i=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,i),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o,0),e.checkFramebufferStatus(e.FRAMEBUFFER)==e.FRAMEBUFFER_COMPLETE}function ut(e){if(e.length==0)return 0;let r=0;for(let t=0;t<e.length;t++)r=(r<<5)-r+e.charCodeAt(t),r|=0;return r}function E(e,r,t,n){t=ct(t,n);const o=e.createShader(r);if(!o)throw new Error("Unable to create shader");return e.shaderSource(o,t),e.compileShader(o),e.getShaderParameter(o,e.COMPILE_STATUS)||console.trace(e.getShaderInfoLog(o)),o}function ct(e,r){if(r==null)return e;let t="";return r.forEach(n=>{t+="#define "+n+`
`}),t+e}function we(e,r,t){let n=e.createProgram();return e.attachShader(n,r),e.attachShader(n,t),e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)||console.trace(e.getProgramInfoLog(n)),n}function Le(e,r){let t={},n=e.getProgramParameter(r,e.ACTIVE_UNIFORMS);for(let o=0;o<n;o++){const i=e.getActiveUniform(r,o);if(!i)continue;let a=i.name;const d=e.getUniformLocation(r,a);d&&(t[a]=d)}return t}function st(e,r,t){return{x:r/e.width,y:t/e.height}}function ft(e){return E(e,e.VERTEX_SHADER,`
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`)}function dt(e){return E(e,e.VERTEX_SHADER,`
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`)}function lt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
    }
`)}function mt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`)}function ht(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`)}function vt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`)}function St(e){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float aspectRatio;

    #define SCALE 25.0

    void main () {
        vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
        float v = mod(uv.x + uv.y, 2.0);
        v = v * 0.1 + 0.8;
        gl_FragColor = vec4(vec3(v), 1.0);
    }
`)}const Tt=`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uBloom;
    uniform sampler2D uSunrays;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

    #ifdef BLOOM
        vec3 bloom = texture2D(uBloom, vUv).rgb;
    #endif

    #ifdef SUNRAYS
        float sunrays = texture2D(uSunrays, vUv).r;
        c *= sunrays;
    #ifdef BLOOM
        bloom *= sunrays;
    #endif
    #endif

    #ifdef BLOOM
        float noise = texture2D(uDithering, vUv * ditherScale).r;
        noise = noise * 2.0 - 1.0;
        bloom += noise / 255.0;
        bloom = linearToGamma(bloom);
        c += bloom;
    #endif

        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
    }
`;function xt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec3 curve;
    uniform float threshold;

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float br = max(c.r, max(c.g, c.b));
        float rq = clamp(br - curve.x, 0.0, curve.y);
        rq = curve.z * rq * rq;
        c *= max(rq, br - threshold) / max(br, 0.0001);
        gl_FragColor = vec4(c, 0.0);
    }
`)}function pt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum;
    }
`)}function Et(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform float intensity;

    void main () {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture, vL);
        sum += texture2D(uTexture, vR);
        sum += texture2D(uTexture, vT);
        sum += texture2D(uTexture, vB);
        sum *= 0.25;
        gl_FragColor = sum * intensity;
    }
`)}function Rt(e){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec4 c = texture2D(uTexture, vUv);
        float br = max(c.r, max(c.g, c.b));
        c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
        gl_FragColor = c;
    }
`)}function Dt(e){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float weight;

    #define ITERATIONS 16

    void main () {
        float Density = 0.3;
        float Decay = 0.95;
        float Exposure = 0.7;

        vec2 coord = vUv;
        vec2 dir = vUv - 0.5;

        dir *= 1.0 / float(ITERATIONS) * Density;
        float illuminationDecay = 1.0;

        float color = texture2D(uTexture, vUv).a;

        for (int i = 0; i < ITERATIONS; i++)
        {
            coord -= dir;
            float col = texture2D(uTexture, coord).a;
            color += col * illuminationDecay * weight;
            illuminationDecay *= Decay;
        }

        gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
    }
`)}function At(e){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`)}function _t(e,r){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

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
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`,r.supportLinearFiltering?void 0:["MANUAL_FILTERING"])}function wt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`)}function Lt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`)}function Ut(e){return E(e,e.FRAGMENT_SHADER,`
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`)}function bt(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`)}function Ot(e){return E(e,e.FRAGMENT_SHADER,`
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`)}class Ft{constructor(r,t,n){p(this,"gl");p(this,"vertexShader");p(this,"fragmentShaderSource");p(this,"programs");p(this,"activeProgram");p(this,"uniforms");this.gl=r,this.vertexShader=t,this.fragmentShaderSource=n,this.programs={},this.activeProgram=null,this.uniforms={}}setKeywords(r){let t=0;for(let o=0;o<r.length;o++)t+=ut(r[o]);let n=this.programs[t];if(n==null){let o=E(this.gl,this.gl.FRAGMENT_SHADER,this.fragmentShaderSource,r);const i=we(this.gl,this.vertexShader,o);if(!i)throw new Error("Failed to create WebGL program with keywords");n=i,this.programs[t]=n}n!=this.activeProgram&&(this.uniforms=Le(this.gl,n),this.activeProgram=n)}bind(){if(!this.activeProgram)throw new Error("No active program to bind");this.gl.useProgram(this.activeProgram)}}class _{constructor(r,t,n){p(this,"gl");p(this,"uniforms");p(this,"program");this.gl=r,this.uniforms={};const o=we(r,t,n);if(!o)throw new Error("Failed to create WebGL program");this.program=o,this.uniforms=Le(r,this.program)}bind(){this.gl.useProgram(this.program)}}function B(e,r,t,n,o,i,a){e.activeTexture(e.TEXTURE0);let d=e.createTexture();if(!d)throw new Error("Failed to create WebGL texture");e.bindTexture(e.TEXTURE_2D,d),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,n,r,t,0,o,i,null);let f=e.createFramebuffer();if(!f)throw new Error("Failed to create WebGL framebuffer");e.bindFramebuffer(e.FRAMEBUFFER,f),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,d,0),e.viewport(0,0,r,t),e.clear(e.COLOR_BUFFER_BIT);let c=1/r,l=1/t;return{texture:d,fbo:f,width:r,height:t,texelSizeX:c,texelSizeY:l,attach(v){return e.activeTexture(e.TEXTURE0+v),e.bindTexture(e.TEXTURE_2D,d),v}}}function g(e,r,t,n,o,i,a){let d=B(e,r,t,n,o,i,a),f=B(e,r,t,n,o,i,a);return{width:r,height:t,texelSizeX:d.texelSizeX,texelSizeY:d.texelSizeY,get read(){return d},set read(c){d=c},get write(){return f},set write(c){f=c},swap(){let c=d;d=f,f=c}}}function yt(e,r,t,n,o,i,a,d,f,c){let l=B(e,n,o,i,a,d,f);return r.bind(),e.uniform1i(r.uniforms.uTexture,t.attach(0)),c(l),l}function te(e,r,t,n,o,i,a,d,f,c){return t.width==n&&t.height==o||(t.read=yt(e,r,t.read,n,o,i,a,d,f,c),t.write=B(e,n,o,i,a,d,f),t.width=n,t.height=o,t.texelSizeX=1/n,t.texelSizeY=1/o),t}function Bt(e,r){let t=e.createTexture();if(!t)throw new Error("Failed to create WebGL texture");e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.REPEAT),e.texImage2D(e.TEXTURE_2D,0,e.RGB,1,1,0,e.RGB,e.UNSIGNED_BYTE,new Uint8Array([255,255,255]));let n={texture:t,width:1,height:1,attach(i){return e.activeTexture(e.TEXTURE0+i),e.bindTexture(e.TEXTURE_2D,t),i}},o=new Image;return o.onload=()=>{n.width=o.width,n.height=o.height,e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGB,e.RGB,e.UNSIGNED_BYTE,o)},o.onerror=()=>{},o.src=r,n}function It(e){const r=e.createBuffer();if(!r)throw new Error("Failed to create WebGL buffer");e.bindBuffer(e.ARRAY_BUFFER,r),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),e.STATIC_DRAW);const t=e.createBuffer();if(!t)throw new Error("Failed to create WebGL index buffer");return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),e.STATIC_DRAW),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.enableVertexAttribArray(0),(n,o=!1)=>{n==null?(e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.bindFramebuffer(e.FRAMEBUFFER,null)):(e.viewport(0,0,n.width,n.height),e.bindFramebuffer(e.FRAMEBUFFER,n.fbo)),o&&(e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT)),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)}}function Nt(e,r,t,n,o,i,a,d,f,c,l,v,T,h,m,x,tt,rt){!e||!e.canvas||(s.BLOOM&&Mt(e,t.read,n,v,T,h,m,l),s.SUNRAYS&&(Yt(e,t.read,t.write,o,x,tt,l),Pt(e,o,i,1,rt,l)),r==null||!s.TRANSPARENT?(e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND)):e.disable(e.BLEND),s.TRANSPARENT||Ct(e,r,zt(s.BACK_COLOR),f,l),r==null&&s.TRANSPARENT&&Gt(e,r,c,l),Xt(e,r,t,n,o,i,a,d,l))}function Ct(e,r,t,n,o){n.bind(),e.uniform4f(n.uniforms.color,t.r,t.g,t.b,1),o(r)}function Gt(e,r,t,n){t.bind(),e.uniform1f(t.uniforms.aspectRatio,e.canvas.width/e.canvas.height),n(r)}function Xt(e,r,t,n,o,i,a,d,f){let c=r==null?e.drawingBufferWidth:r.width,l=r==null?e.drawingBufferHeight:r.height;if(d.bind(),s.SHADING&&e.uniform2f(d.uniforms.texelSize,1/c,1/l),e.uniform1i(d.uniforms.uTexture,t.read.attach(0)),s.BLOOM){e.uniform1i(d.uniforms.uBloom,n.attach(1)),e.uniform1i(d.uniforms.uDithering,a.attach(2));let v=st(a,c,l);e.uniform2f(d.uniforms.ditherScale,v.x,v.y)}s.SUNRAYS&&e.uniform1i(d.uniforms.uSunrays,o.attach(3)),f(r)}function Mt(e,r,t,n,o,i,a,d){if(n.length<2)return;let f=t;e.disable(e.BLEND),o.bind();let c=s.BLOOM_THRESHOLD*s.BLOOM_SOFT_KNEE+1e-4,l=s.BLOOM_THRESHOLD-c,v=c*2,T=.25/c;e.uniform3f(o.uniforms.curve,l,v,T),e.uniform1f(o.uniforms.threshold,s.BLOOM_THRESHOLD),e.uniform1i(o.uniforms.uTexture,r.attach(0)),d(f),i.bind();for(let h=0;h<n.length;h++){let m=n[h];e.uniform2f(i.uniforms.texelSize,f.texelSizeX,f.texelSizeY),e.uniform1i(i.uniforms.uTexture,f.attach(0)),d(m),f=m}e.blendFunc(e.ONE,e.ONE),e.enable(e.BLEND);for(let h=n.length-2;h>=0;h--){let m=n[h];e.uniform2f(i.uniforms.texelSize,f.texelSizeX,f.texelSizeY),e.uniform1i(i.uniforms.uTexture,f.attach(0)),e.viewport(0,0,m.width,m.height),d(m),f=m}e.disable(e.BLEND),a.bind(),e.uniform2f(a.uniforms.texelSize,f.texelSizeX,f.texelSizeY),e.uniform1i(a.uniforms.uTexture,f.attach(0)),e.uniform1f(a.uniforms.intensity,s.BLOOM_INTENSITY),d(t)}function Yt(e,r,t,n,o,i,a){e.disable(e.BLEND),o.bind(),e.uniform1i(o.uniforms.uTexture,r.attach(0)),a(t),i.bind(),e.uniform1f(i.uniforms.weight,s.SUNRAYS_WEIGHT),e.uniform1i(i.uniforms.uTexture,t.attach(0)),a(n)}function Pt(e,r,t,n,o,i){o.bind();for(let a=0;a<n;a++)e.uniform2f(o.uniforms.texelSize,r.texelSizeX,0),e.uniform1i(o.uniforms.uTexture,r.attach(0)),i(t),e.uniform2f(o.uniforms.texelSize,0,r.texelSizeY),e.uniform1i(o.uniforms.uTexture,t.attach(0)),i(r)}function zt(e){return{r:e.r/255,g:e.g/255,b:e.b/255}}function Ht(e,r,t,n,o,i,a,d,f,c,l,v,T,h,m){e.disable(e.BLEND),d.bind(),e.uniform2f(d.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(d.uniforms.uVelocity,t.read.attach(0)),m(o),f.bind(),e.uniform2f(f.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(f.uniforms.uVelocity,t.read.attach(0)),e.uniform1i(f.uniforms.uCurl,o.attach(1)),e.uniform1f(f.uniforms.curl,s.CURL),e.uniform1f(f.uniforms.dt,r),m(t.write),t.swap(),c.bind(),e.uniform2f(c.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(c.uniforms.uVelocity,t.read.attach(0)),m(i),l.bind(),e.uniform1i(l.uniforms.uTexture,a.read.attach(0)),e.uniform1f(l.uniforms.value,s.PRESSURE),m(a.write),a.swap(),v.bind(),e.uniform2f(v.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(v.uniforms.uDivergence,i.attach(0));for(let x=0;x<s.PRESSURE_ITERATIONS;x++)e.uniform1i(v.uniforms.uPressure,a.read.attach(1)),m(a.write),a.swap();T.bind(),e.uniform2f(T.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(T.uniforms.uPressure,a.read.attach(0)),e.uniform1i(T.uniforms.uVelocity,t.read.attach(1)),m(t.write),t.swap(),h.bind(),e.uniform2f(h.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform2f(h.uniforms.dyeTexelSize,t.texelSizeX,t.texelSizeY),e.uniform1i(h.uniforms.uVelocity,t.read.attach(0)),e.uniform1i(h.uniforms.uSource,t.read.attach(0)),e.uniform1f(h.uniforms.dt,r),e.uniform1f(h.uniforms.dissipation,s.VELOCITY_DISSIPATION),m(t.write),t.swap(),h.bind(),e.uniform2f(h.uniforms.texelSize,t.texelSizeX,t.texelSizeY),e.uniform2f(h.uniforms.dyeTexelSize,n.texelSizeX,n.texelSizeY),e.uniform1i(h.uniforms.uVelocity,t.read.attach(0)),e.uniform1i(h.uniforms.uSource,n.read.attach(1)),e.uniform1f(h.uniforms.dt,r),e.uniform1f(h.uniforms.dissipation,s.DENSITY_DISSIPATION),m(n.write),n.swap()}function j(e,r,t,n,o,i,a){let d=r.deltaX*s.SPLAT_FORCE,f=r.deltaY*s.SPLAT_FORCE;F(e,r.texcoordX,r.texcoordY,d,f,r.color,t,n,o,i,a)}function Q(e,r,t,n,o,i,a){for(let d=0;d<r;d++){const f=b();f.r*=10,f.g*=10,f.b*=10;const c=Math.random(),l=Math.random(),v=1e3*(Math.random()-.5),T=1e3*(Math.random()-.5);F(e,c,l,v,T,f,t,n,o,i,a)}}function F(e,r,t,n,o,i,a,d,f,c,l){a.bind(),e.uniform1i(a.uniforms.uTarget,d.read.attach(0)),e.uniform1f(a.uniforms.aspectRatio,c.width/c.height),e.uniform2f(a.uniforms.point,r,t),e.uniform3f(a.uniforms.color,n,o,0),e.uniform1f(a.uniforms.radius,gt(s.SPLAT_RADIUS/100,c)),l(d.write),d.swap(),e.uniform1i(a.uniforms.uTarget,f.read.attach(0)),e.uniform3f(a.uniforms.color,i.r,i.g,i.b),l(f.write),f.swap()}function gt(e,r){let t=r.width/r.height;return t>1&&(e*=t),e}function k(e,r,t,n,o,i){const d=s.SPLAT_COUNT,f=.1,c=s.SPLAT_SPEED;for(let l=0;l<d;l++){const v=l*f,T=.5,h=c,m=0,x=b();x.r*=10,x.g*=10,x.b*=10,F(e,v,T,h,m,x,r,t,n,o,i)}}function W(e,r,t,n,o,i){const d=s.SPLAT_COUNT,f=.1,c=-s.SPLAT_SPEED;for(let l=0;l<d;l++){const v=1-l*f,T=.5,h=c,m=0,x=b();x.r*=10,x.g*=10,x.b*=10,F(e,v,T,h,m,x,r,t,n,o,i)}}function Ue(e,r,t,n,o,i){const d=s.SPLAT_COUNT,f=.1,c=s.SPLAT_SPEED;for(let l=0;l<d;l++){const T=l*f,h=0,m=c,x=b();x.r*=10,x.g*=10,x.b*=10,F(e,.5,T,h,m,x,r,t,n,o,i)}}function be(e,r,t,n,o,i){const a=s.SPLAT_COUNT,d=.1,f=s.SPLAT_SPEED;for(let c=0;c<a;c++){const l=1-c*d,v=.4,T=-f,h=0,m=b();m.r*=10,m.g*=10,m.b*=10,F(e,l,v,T,h,m,r,t,n,o,i)}for(let c=0;c<a;c++){const l=c*d,v=.6,T=f,h=0,m=b();m.r*=10,m.g*=10,m.b*=10,F(e,l,v,T,h,m,r,t,n,o,i)}}function Oe(e,r,t,n,o,i){const a=s.SPLAT_COUNT,d=.1,f=s.SPLAT_SPEED;for(let c=0;c<a;c++){const v=1-c*d,T=0,h=-f,m=b();m.r*=10,m.g*=10,m.b*=10,F(e,.4,v,T,h,m,r,t,n,o,i)}for(let c=0;c<a;c++){const v=1-c*d,T=0,h=-f,m=b();m.r*=10,m.g*=10,m.b*=10,F(e,.6,v,T,h,m,r,t,n,o,i)}}function Fe(e,r,t,n,o,i){const d=s.SPLAT_COUNT,f=.1,c=-s.SPLAT_SPEED;for(let l=0;l<d;l++){const T=1-l*f,h=0,m=c,x=b();x.r*=10,x.g*=10,x.b*=10,F(e,.5,T,h,m,x,r,t,n,o,i)}}function ye(e,r,t,n,o,i){const f=s.SPLAT_SPEED,c=s.SPLAT_COUNT;[{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}].forEach(v=>{for(let T=0;T<c;T++){const h=(.5-v.x)*f*20,m=(.5-v.y)*f*20,x=b();x.r*=10,x.g*=10,x.b*=10,F(e,v.x,v.y,h,m,x,r,t,n,o,i)}})}function b(){let e=kt(Math.random(),1,1);return e.r*=.15,e.g*=.15,e.b*=.15,e}function kt(e,r,t){let n=0,o=0,i=0,a=0,d=0,f=0,c=0,l=0;switch(a=Math.floor(e*6),d=e*6-a,f=t*(1-r),c=t*(1-d*r),l=t*(1-(1-d)*r),a%6){case 0:n=t,o=l,i=f;break;case 1:n=c,o=t,i=f;break;case 2:n=f,o=t,i=l;break;case 3:n=f,o=c,i=t;break;case 4:n=l,o=f,i=t;break;case 5:n=t,o=f,i=c;break}return{r:n,g:o,b:i}}function re(e,r,t,n,o){e.id=r,e.down=!0,e.moved=!1,e.texcoordX=t/o.width,e.texcoordY=1-n/o.height,e.prevTexcoordX=e.texcoordX,e.prevTexcoordY=e.texcoordY,e.deltaX=0,e.deltaY=0,e.color=b()}function oe(e,r,t,n){e.prevTexcoordX=e.texcoordX,e.prevTexcoordY=e.texcoordY,e.texcoordX=r/n.width,e.texcoordY=1-t/n.height,e.deltaX=Wt(e.texcoordX-e.prevTexcoordX,n),e.deltaY=Vt(e.texcoordY-e.prevTexcoordY,n),e.moved=Math.abs(e.deltaX)>0||Math.abs(e.deltaY)>0}function ne(e){e.down=!1}function Wt(e,r){let t=r.width/r.height;return t<1&&(e*=t),e}function Vt(e,r){let t=r.width/r.height;return t>1&&(e/=t),e}function $t(e,r){e.addEventListener("mousedown",t=>{let n=y(t.offsetX),o=y(t.offsetY),i=O.find(a=>a.id==-1);i==null&&(i=new P),re(i,-1,n,o,e)}),e.addEventListener("mousemove",t=>{let n=O[0];if(!n.down)return;let o=y(t.offsetX),i=y(t.offsetY);oe(n,o,i,e),r(n)}),window.addEventListener("mouseup",()=>{ne(O[0])}),e.addEventListener("touchstart",t=>{t.preventDefault();const n=t.targetTouches;for(;n.length>=O.length;)O.push(new P);for(let o=0;o<n.length;o++){let i=y(n[o].pageX),a=y(n[o].pageY);re(O[o+1],n[o].identifier,i,a,e)}}),e.addEventListener("touchmove",t=>{t.preventDefault();const n=t.targetTouches;for(let o=0;o<n.length;o++){let i=O[o+1];if(!i.down)continue;let a=y(n[o].pageX),d=y(n[o].pageY);oe(i,a,d,e),r(i)}},!1),window.addEventListener("touchend",t=>{const n=t.changedTouches;for(let o=0;o<n.length;o++){let i=O.find(a=>a.id==n[o].identifier);i!=null&&ne(i)}}),window.addEventListener("keydown",t=>{t.code==="KeyP"&&(s.PAUSED=!s.PAUSED),t.key===" "&&X.push(parseInt(Math.random()*20+"")+5)})}function qt(e,r,t,n,o,i,a,d,f){var c=new dat.GUI({width:300});c.add(s,"DYE_RESOLUTION",{high:1024,medium:512,low:256,"very low":128}).name("quality").onFinishChange(d),c.add(s,"SIM_RESOLUTION",{32:32,64:64,128:128,256:256}).name("sim resolution").onFinishChange(d),c.add(s,"DENSITY_DISSIPATION",0,4).name("density diffusion"),c.add(s,"VELOCITY_DISSIPATION",0,4).name("velocity diffusion"),c.add(s,"PRESSURE",0,1).name("pressure"),c.add(s,"CURL",0,50).name("vorticity").step(1),c.add(s,"SPLAT_RADIUS",.01,1).name("splat radius"),c.add(s,"SHADING").name("shading").onFinishChange(f),c.add(s,"COLORFUL").name("colorful"),c.add(s,"PAUSED").name("paused").listen(),c.add(s,"SPLAT_SPEED",100,2e3).name("splat speed"),c.add(s,"SPLAT_COUNT",1,50).name("splat count"),c.add(s,"SHOW_DEBUG").name("show debug info").onChange(()=>{const m=document.getElementById("debug-info");m&&(m.style.display=s.SHOW_DEBUG?"block":"none")});let l=c.addFolder("Splats");N(l,t,"Splats Right"),N(l,n,"Splats Left"),N(l,r,"Splats Vertical"),N(l,e,"Splats Horizontal"),N(l,o,"Splats Up"),N(l,i,"Splats Down"),N(l,a,"Corner Splats"),c.add(s,"MIRROR_MODE").name("Mirror Mode");let v=c.addFolder("Bloom");v.add(s,"BLOOM").name("enabled").onFinishChange(f),v.add(s,"BLOOM_INTENSITY",.1,2).name("intensity"),v.add(s,"BLOOM_THRESHOLD",0,1).name("threshold");let T=c.addFolder("Sunrays");T.add(s,"SUNRAYS").name("enabled").onFinishChange(f),T.add(s,"SUNRAYS_WEIGHT",.3,1).name("weight");let h=c.addFolder("Capture");return h.addColor(s,"BACK_COLOR").name("background color"),h.add(s,"TRANSPARENT").name("transparent"),_e()&&c.close(),c}function N(e,r,t){e.add({fun:()=>{r()}},"fun").name(t)}const V=new Map;let C=null,Z=!1;function Be(){const r=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws`;C=new WebSocket(r),C.onopen=Kt,C.onmessage=Jt,C.onclose=nr,C.onerror=ir,console.log("Remote control initialization started")}function Kt(){Z=!0,console.log("WebSocket connection established"),ar({type:"connect",payload:{role:"simulator"}})}function Jt(e){try{const r=JSON.parse(e.data);switch(r.type){case"connect_ack":console.log(`Connected to server. Session ID: ${r.payload.sessionId}`);break;case"remote_input":jt(r.payload);break;case"command":Zt(r.payload);break;default:console.warn(`Unknown message type: ${r.type}`)}}catch(r){console.error("Error processing WebSocket message:",r)}}function jt(e){const{eventType:r,position:t,controllerId:n}=e;let o=V.get(n);switch(o||(o=new P,o.id=n,V.set(n,o)),r){case"mousedown":o.down=!0,o.moved=!1,o.texcoordX=t.x,o.texcoordY=t.y,o.prevTexcoordX=t.x,o.prevTexcoordY=t.y,o.deltaX=0,o.deltaY=0,e.color&&(o.color=e.color);break;case"mousemove":if(!o.down)return;o.prevTexcoordX=o.texcoordX,o.prevTexcoordY=o.texcoordY,o.texcoordX=t.x,o.texcoordY=t.y,o.deltaX=o.texcoordX-o.prevTexcoordX,o.deltaY=o.texcoordY-o.prevTexcoordY,o.moved=Math.abs(o.deltaX)>0||Math.abs(o.deltaY)>0;break;case"mouseup":o.down=!1;break}}function Qt(e,r,t,n,o,i){V.forEach(a=>{a.moved&&(a.moved=!1,j(e,a,r,t,n,o,i))})}function Zt(e){const{command:r,parameters:t}=e;switch(r){case"random_splats":er((t==null?void 0:t.count)||5);break;case"clear":break;case"preset_pattern":tr((t==null?void 0:t.patternName)||"default");break}}const I={randomSplats:0,patternName:null};function er(e){I.randomSplats=e}function tr(e){I.patternName=e}function rr(e,r,t,n,o,i){Qt(e,r,t,n,o,i),I.randomSplats>0&&(Q(e,I.randomSplats,r,t,n,o,i),I.randomSplats=0),I.patternName&&(or(I.patternName,e,r,t,n,o,i),I.patternName=null)}function or(e,r,t,n,o,i,a){switch(e){case"right":k(r,t,n,o,i,a);break;case"left":W(r,t,n,o,i,a);break;case"up":Ue(r,t,n,o,i,a);break;case"down":Fe(r,t,n,o,i,a);break;case"horizontal":be(r,t,n,o,i,a);break;case"vertical":Oe(r,t,n,o,i,a);break;case"corners":ye(r,t,n,o,i,a);break;default:k(r,t,n,o,i,a),W(r,t,n,o,i,a);break}}function nr(e){Z=!1,console.log(`WebSocket connection closed: ${e.code} ${e.reason}`),setTimeout(Be,5e3)}function ir(e){console.error("WebSocket error:",e)}function ar(e){C&&Z&&C.send(JSON.stringify(e))}let S=null,u=null,R=null,w,D,ie,ae,ue,ce,se,fe,de,le,me,he,ve,Se,Te,xe,pe,Ee,Re,De,Ie,$,Ne,Ce,Ge,Xe,Me,Ye,Pe,ze,U,He,ge,ke,We,Ve,$e,H,A,L,qe,Ke,Je,je,q=[],Qe,Ze,et,K=Date.now(),Y=0,G;function ur(){if(!S)return!1;let e=y(S.clientWidth),r=y(S.clientHeight);return S.width!=e||S.height!=r?(S.width=e,S.height=r,window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateCanvasInfo(`${e}x${r}`),!0):!1}function J(){if(!u||!R)return;let e=z(u,s.SIM_RESOLUTION),r=z(u,s.DYE_RESOLUTION);const t=R.halfFloatTexType,n=R.formatRGBA,o=R.formatRG,i=R.formatR,a=R.supportLinearFiltering?u.LINEAR:u.NEAREST;u.disable(u.BLEND),A==null?A=g(u,r.width,r.height,n.internalFormat,n.format,t,a):A=te(u,$,A,r.width,r.height,n.internalFormat,n.format,t,a,w),L==null?L=g(u,e.width,e.height,o.internalFormat,o.format,t,a):L=te(u,$,L,e.width,e.height,o.internalFormat,o.format,t,a,w),qe=B(u,e.width,e.height,i.internalFormat,i.format,t,u.NEAREST),Ke=B(u,e.width,e.height,i.internalFormat,i.format,t,u.NEAREST),Je=g(u,e.width,e.height,i.internalFormat,i.format,t,u.NEAREST),cr(),sr()}function cr(){if(!u||!R)return;let e=z(u,s.BLOOM_RESOLUTION);const r=R.halfFloatTexType,t=R.formatRGBA,n=R.supportLinearFiltering?u.LINEAR:u.NEAREST;je=B(u,e.width,e.height,t.internalFormat,t.format,r,n),q.length=0;for(let o=0;o<s.BLOOM_ITERATIONS;o++){let i=e.width>>o+1,a=e.height>>o+1;if(i<2||a<2)break;let d=B(u,i,a,t.internalFormat,t.format,r,n);q.push(d)}}function sr(){if(!u||!R)return;let e=z(u,s.SUNRAYS_RESOLUTION);const r=R.halfFloatTexType,t=R.formatR,n=R.supportLinearFiltering?u.LINEAR:u.NEAREST;Qe=B(u,e.width,e.height,t.internalFormat,t.format,r,n),Ze=B(u,e.width,e.height,t.internalFormat,t.format,r,n)}function Ae(){if(!H)return;let e=[];s.SHADING&&e.push("SHADING"),s.BLOOM&&e.push("BLOOM"),s.SUNRAYS&&e.push("SUNRAYS"),H.setKeywords(e)}function fr(){let e=Date.now(),r=(e-K)/1e3;return r=Math.min(r,.016666),K=e,r}function dr(e){s.COLORFUL&&(Y+=e*s.COLOR_UPDATE_SPEED,Y>=1&&(Y=hr(Y,0,1),O.forEach(r=>{r.color=b()})))}function lr(){if(!(!u||!S)){if(X.length>0&&X[X.length-1]!==void 0){const e=X.pop();e!==void 0&&Q(u,e,U,L,A,S,w)}O.forEach(e=>{e.moved&&(e.moved=!1,j(u,e,U,L,A,S,w))})}}function ee(){if(!u||!S)return;const e=fr();ur()&&J(),dr(e),lr(),u&&S&&rr(u,U,L,A,S,w),s.PAUSED||Ht(u,e,L,A,Ke,qe,Je,ke,We,ge,Ne,Ve,$e,He,w),Nt(u,null,A,je,Qe,Ze,et,H,Ce,Ge,w,q,Xe,Me,Ye,Pe,ze,Ie),G=window.requestAnimationFrame(ee)}function mr(){if(!S||!u||!R)return;if(window.debugInfo){window.debugInfo.updateWebGLStatus(`Initialized (WebGL${u instanceof WebGL2RenderingContext?"2":"1"})`);const f=document.getElementById("debug-info");f&&(f.style.display=s.SHOW_DEBUG?"block":"none")}_e()&&(s.DYE_RESOLUTION=512),R.supportLinearFiltering||(s.DYE_RESOLUTION=512,s.SHADING=!1,s.BLOOM=!1,s.SUNRAYS=!1),w=It(u),D=ft(u),ie=dt(u),ae=lt(u),ue=mt(u),ce=ht(u),se=vt(u),fe=St(u),de=xt(u),le=pt(u),me=Et(u),he=Rt(u),ve=Dt(u),Se=At(u),Te=_t(u,R),xe=wt(u),pe=Lt(u),Ee=Ut(u),Re=bt(u),De=Ot(u),Ie=new _(u,ie,ae),$=new _(u,D,ue),Ne=new _(u,D,ce),Ce=new _(u,D,se),Ge=new _(u,D,fe),Xe=new _(u,D,de),Me=new _(u,D,le),Ye=new _(u,D,me),Pe=new _(u,D,he),ze=new _(u,D,ve),U=new _(u,D,Se),He=new _(u,D,Te),ge=new _(u,D,xe),ke=new _(u,D,pe),We=new _(u,D,Ee),Ve=new _(u,D,Re),$e=new _(u,D,De),H=new Ft(u,D,Tt),et=Bt(u,"/LDR_LLL1_0.png"),J(),Ae(),Be(),qt(()=>{!u||!S||be(u,U,L,A,S,w)},()=>{!u||!S||Oe(u,U,L,A,S,w)},()=>{!u||!S||k(u,U,L,A,S,w)},()=>{!u||!S||W(u,U,L,A,S,w)},()=>{!u||!S||Ue(u,U,L,A,S,w)},()=>{!u||!S||Fe(u,U,L,A,S,w)},()=>{!u||!S||ye(u,U,L,A,S,w)},J,Ae),u&&S&&Q(u,parseInt(Math.random()*20+"")+5,U,L,A,S,w),$t(S,f=>{!u||!S||j(u,f,U,L,A,S,w)}),window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateAnimationStatus("Starting"),ee()}document.addEventListener("DOMContentLoaded",()=>{if(S=document.getElementsByTagName("canvas")[0],!S)return;window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateCanvasInfo(`${S.clientWidth}x${S.clientHeight}`);const e=it(S);u=e.gl,R=e.ext,u&&R?(window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateWebGLStatus("Context acquired"),mr(),window.addEventListener("focus",()=>{window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateAnimationStatus("Resuming after focus"),K=Date.now(),G||(G=window.requestAnimationFrame(ee))}),window.addEventListener("blur",()=>{window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateAnimationStatus("Paused (window blur)"),G&&(window.cancelAnimationFrame(G),G=0)})):window.debugInfo&&s.SHOW_DEBUG&&window.debugInfo.updateWebGLStatus("Error: WebGL initialization failed")});function hr(e,r,t){const n=t-r;return n==0?r:(e-r)%n+r}
//# sourceMappingURL=main-2e6c33b0.js.map

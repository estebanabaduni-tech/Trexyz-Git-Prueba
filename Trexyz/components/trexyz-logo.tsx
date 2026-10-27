"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { cn } from "@/lib/utils";
import { ORBITRON_FONT_DATA } from "@/lib/orbitron-font";

const BG = 0x05070b;

export default function TrexyzLogo({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isMobile = matchMedia("(pointer: coarse)").matches;

    // ============ Renderer ============
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    const PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(PR);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.localClippingEnabled = true;
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const CAM_DIST = 16;
    const TARGET = new THREE.Vector3(0, -0.15, 0);

    // ============ Entorno de estudio (reflejos del cromado) ============
    const studioDisposables: { dispose(): void }[] = [];
    function buildStudio() {
      const s = new THREE.Scene();
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
        fragmentShader: `varying vec3 vP;
        void main(){
          float h = vP.y;
          vec3 c = mix(vec3(.004,.006,.012), vec3(.05,.06,.09), smoothstep(-.3,.9,h));
          float front = smoothstep(-.1, .55, vP.z);
          float upper = smoothstep(-.215, -.175, h);
          vec3 bright = mix(vec3(.85,.9,1.), vec3(.12,.14,.19), smoothstep(-.17,.55,h));
          vec3 wall = mix(vec3(.015,.02,.035), bright, upper);
          wall += vec3(.05,.22,.9) * exp(-pow((h+.33)*11.,2.));
          c = mix(c, wall, front);
          c += vec3(.5,.62,.85) * exp(-pow(h*22.,2.)) * .3;
          gl_FragColor = vec4(c, 1.);
        }`,
      });
      const skyGeo = new THREE.SphereGeometry(60, 96, 48);
      s.add(new THREE.Mesh(skyGeo, skyMat));
      studioDisposables.push(skyMat, skyGeo);
      const lf = (w: number, h: number, hex: number, k: number, x: number, y: number, z: number) => {
        const geo = new THREE.PlaneGeometry(w, h);
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(hex).multiplyScalar(k),
          side: THREE.DoubleSide,
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.lookAt(0, 0, 0);
        s.add(m);
        studioDisposables.push(geo, mat);
      };
      lf(26, 7, 0xffffff, 0.6, 0, 22, 3);
      lf(2.2, 18, 0xffffff, 0.7, -18, 3, 8);
      lf(2.2, 18, 0xe4eeff, 0.55, 18, 3, 8);
      lf(14, 1.4, 0x2f7bff, 1.4, -10, 5, -16);
      lf(14, 1.4, 0x2f7bff, 1.4, 12, -1, -14);
      lf(4, 16, 0x5aa8ff, 1.0, -22, 0, -4);
      return s;
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(buildStudio(), 0.02);
    scene.environment = envRT.texture;

    // ============ Luces ============
    scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x05070b, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(5, 8, 9);
    scene.add(key);
    const rimL = new THREE.DirectionalLight(0x3b8cff, 0.45);
    rimL.position.set(-8, 3, -6);
    scene.add(rimL);
    const rimR = new THREE.DirectionalLight(0x6fb6ff, 0.25);
    rimR.position.set(8, -1, -6);
    scene.add(rimR);
    const tipLight = new THREE.PointLight(0x8fd0ff, 2, 4, 2);
    scene.add(tipLight);
    const underLight = new THREE.PointLight(0x2f7bff, 1.2, 7, 2);
    underLight.position.set(0, -2.2, 3.2);
    scene.add(underLight);

    // ============ Texturas procedurales ============
    function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      draw(c.getContext("2d")!, w, h);
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    const radial = (stops: [number, string][]) =>
      canvasTex(256, 256, (g) => {
        const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        stops.forEach(([o, c]) => grd.addColorStop(o, c));
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 256);
      });
    const glowTex = radial([[0, "rgba(120,190,255,1)"], [0.3, "rgba(40,120,255,.5)"], [1, "rgba(0,40,160,0)"]]);
    const dotTex = radial([[0, "rgba(255,255,255,1)"], [0.25, "rgba(160,210,255,.8)"], [1, "rgba(60,140,255,0)"]]);
    const layerTex = canvasTex(8, 512, (g, w, h) => {
      for (let y = 0; y < h; y++) {
        const v = (Math.pow(0.5 + 0.5 * Math.sin((y / h) * Math.PI * 2 * 14), 0.6) * 255) | 0;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(0, y, w, 1);
      }
    }, false);
    layerTex.wrapS = layerTex.wrapT = THREE.RepeatWrapping;
    const brushedTex = canvasTex(512, 64, (g, w, h) => {
      g.fillStyle = "#888";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const v = (110 + Math.random() * 60) | 0;
        g.fillStyle = `rgba(${v},${v},${v},.5)`;
        g.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 120, 1);
      }
    }, false);
    brushedTex.wrapS = brushedTex.wrapT = THREE.RepeatWrapping;

    // ============ Materiales ============
    const hdr = (hex: number, k: number) => new THREE.Color(hex).multiplyScalar(k);
    const M = {
      blue: new THREE.MeshPhysicalMaterial({ color: 0x0050ff, metalness: 0, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.6, emissive: 0x0030b0, emissiveIntensity: 0.3 }),
      blueBack: new THREE.MeshStandardMaterial({ color: 0x06215e, metalness: 0.6, roughness: 0.4 }),
      strip: new THREE.MeshStandardMaterial({ color: 0x0b1a33, emissive: 0x9fd8ff, emissiveIntensity: 1.25, roughness: 0.5, envMapIntensity: 0.2 }),
      cube: new THREE.MeshPhysicalMaterial({ color: 0x1668ff, metalness: 0.05, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, emissive: 0x0a3ad0, emissiveIntensity: 0.3, bumpMap: layerTex, bumpScale: 0.22, side: THREE.DoubleSide }),
      alu: new THREE.MeshStandardMaterial({ color: 0x9aa2ad, metalness: 1, roughness: 0.4, roughnessMap: brushedTex }),
      aluDark: new THREE.MeshStandardMaterial({ color: 0x8e96a1, metalness: 1, roughness: 0.38, roughnessMap: brushedTex }),
      anod: new THREE.MeshPhysicalMaterial({ color: 0x15181e, metalness: 0.85, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xe8edf3, metalness: 1, roughness: 0.1, envMapIntensity: 0.9 }),
      textFace: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, clearcoat: 0.6, envMapIntensity: 1.25 }),
      textSide: new THREE.MeshStandardMaterial({ color: 0xb8c2cf, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 }),
      neon: new THREE.MeshBasicMaterial({ color: hdr(0x2f86ff, 1.8) }),
      neonWhite: new THREE.MeshBasicMaterial({ color: hdr(0xd8ecff, 1.25) }),
    };

    const logo = new THREE.Group();
    scene.add(logo);

    // ============ "X": dos chevrones biselados ============
    function chevronShape(w: number, h: number, arm: number, tipX: number) {
      const s = new THREE.Shape();
      s.moveTo(-w, h);
      s.lineTo(-w + arm, h);
      s.lineTo(tipX, 0);
      s.lineTo(-w + arm, -h);
      s.lineTo(-w, -h);
      s.lineTo(tipX - arm, 0);
      s.closePath();
      return s;
    }
    const CH = { w: 2.6, h: 1.5, arm: 0.66, tip: -0.32, depth: 0.42 };
    const chevGeo = new THREE.ExtrudeGeometry(chevronShape(CH.w, CH.h, CH.arm, CH.tip), {
      depth: CH.depth, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 8, curveSegments: 1,
    });
    chevGeo.translate(0, 0, -CH.depth / 2);
    const s1 = 0.1, s2 = 0.17;
    const stripGeo = new THREE.ExtrudeGeometry(
      chevronShape(CH.w - s1, CH.h - 0.12, s2 - s1, CH.tip - CH.arm + s2),
      { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.008, bevelSegments: 2 }
    );
    stripGeo.translate(-0.02, 0, CH.depth / 2 + 0.09);
    const backGeo = new THREE.ExtrudeGeometry(
      chevronShape(CH.w - 0.06, CH.h - 0.06, CH.arm - 0.12, CH.tip - 0.06),
      { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 }
    );
    backGeo.translate(0, 0, -CH.depth / 2 - 0.3);

    const xGroup = new THREE.Group();
    xGroup.position.y = 0.5;
    logo.add(xGroup);
    for (const side of [1, -1]) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(chevGeo, M.blue), new THREE.Mesh(stripGeo, M.strip), new THREE.Mesh(backGeo, M.blueBack));
      g.scale.x = side;
      g.userData.side = side;
      xGroup.add(g);
    }

    // ============ Cabezal extrusor ============
    const head = new THREE.Group();
    const HEAD_Y = 2.55;
    head.position.y = HEAD_Y;
    logo.add(head);

    const plate = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.34, 0.95, 4, 0.06), M.anod);
    plate.position.y = 0.58;
    head.add(plate);
    const screwGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 24);
    const socketGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.045, 6);
    for (const x of [-0.75, 0.75])
      for (const y of [0.5, 0.66]) {
        const sc = new THREE.Mesh(screwGeo, M.chrome);
        sc.rotation.x = Math.PI / 2;
        sc.position.set(x, y, 0.49);
        const so = new THREE.Mesh(socketGeo, M.anod);
        so.rotation.x = Math.PI / 2;
        so.position.set(x, y, 0.5);
        head.add(sc, so);
      }
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.025, 0.02), M.neon);
    badge.position.set(0, 0.58, 0.48);
    head.add(badge);

    for (const side of [1, -1]) {
      const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 40), M.alu);
      bearing.rotation.z = Math.PI / 2;
      bearing.position.set(side * 1.2, 0.66, 0);
      head.add(bearing);
      for (const dx of [-0.13, 0.13]) {
        const groove = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 40), M.anod);
        groove.rotation.y = Math.PI / 2;
        groove.position.set(side * 1.2 + dx, 0.66, 0);
        head.add(groove);
      }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.3, 32), M.chrome);
      rod.rotation.z = Math.PI / 2;
      rod.position.set(side * 2.2, 0.66, 0);
      head.add(rod);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.neonWhite);
      cap.position.set(side * 3.35, 0.66, 0);
      head.add(cap);
      const tube = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 1.75, 6, 16), M.neon);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(side * 2.1, 0.33, 0);
      head.add(tube);
    }
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.85, 32), M.aluDark);
    head.add(core);
    const FINS = 10;
    for (let i = 0; i < FINS; i++) {
      const r = 0.66 - i * 0.025;
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.042, 64), M.alu);
      fin.position.y = 0.33 - i * 0.075;
      head.add(fin);
    }
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 24), M.chrome);
    hb.position.y = -0.48;
    head.add(hb);
    const block = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.3, 0.56, 3, 0.04), M.aluDark);
    block.position.y = -0.7;
    head.add(block);
    const cart = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 24), M.chrome);
    cart.rotation.z = Math.PI / 2;
    cart.position.set(0.48, -0.74, 0.1);
    head.add(cart);
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.58, -0.74, 0.1),
      new THREE.Vector3(0.82, -0.7, 0.12),
      new THREE.Vector3(0.95, -0.35, 0.05),
      new THREE.Vector3(0.78, 0.1, 0),
      new THREE.Vector3(0.7, 0.42, 0),
    ]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 40, 0.022, 10), M.neon));
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.13, 6), M.chrome);
    hex.position.y = -0.92;
    head.add(hex);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.19, 0.3, 48), M.chrome);
    cone.position.y = -1.13;
    head.add(cone);
    const tipGlow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), new THREE.MeshBasicMaterial({ color: hdr(0xbfe6ff, 2.2) }));
    tipGlow.position.y = -1.3;
    head.add(tipGlow);
    const NOZZLE_Y = -1.3;

    // ============ Cubo impreso ============
    const CUBE = 0.95;
    const cubeTilt = new THREE.Group();
    cubeTilt.position.y = -0.55;
    cubeTilt.rotation.x = 0.5;
    logo.add(cubeTilt);
    const cubeSpin = new THREE.Group();
    cubeSpin.rotation.y = Math.PI / 4;
    cubeTilt.add(cubeSpin);
    const clipPlane = new THREE.Plane();
    M.cube.clippingPlanes = [clipPlane];
    const cube = new THREE.Mesh(new RoundedBoxGeometry(CUBE, CUBE, CUBE, 6, 0.055), M.cube);
    cubeSpin.add(cube);
    const edgeMat = new THREE.LineBasicMaterial({ color: hdr(0x9fdcff, 1.6), transparent: true, opacity: 0.55, clippingPlanes: [clipPlane] });
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE * 0.985, CUBE * 0.985, CUBE * 0.985)), edgeMat));

    // Capa que se está imprimiendo: relleno tenue + contorno luminoso
    const layer = new THREE.Group();
    cube.add(layer);
    const sliceMat = new THREE.MeshBasicMaterial({ color: hdr(0x5fb4ff, 0.9), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const slice = new THREE.Mesh(new THREE.PlaneGeometry(CUBE * 0.96, CUBE * 0.96), sliceMat);
    slice.rotation.x = -Math.PI / 2;
    layer.add(slice);
    const rimMat = new THREE.LineBasicMaterial({ color: hdr(0xcfeaff, 1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    {
      const q = CUBE * 0.49;
      const pts = [[-q, -q], [q, -q], [q, q], [-q, q]].map(([x, z]) => new THREE.Vector3(x, 0, z));
      layer.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), rimMat));
    }

    // Hilo de filamento (boquilla -> punto que recorre el contorno de la capa)
    const beamMat = new THREE.MeshBasicMaterial({ color: hdr(0xa8dcff, 1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 8), beamMat);
    logo.add(beam);
    const dotMat = new THREE.SpriteMaterial({ map: dotTex, color: hdr(0xbfe6ff, 1.4), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const hotDot = new THREE.Sprite(dotMat);
    hotDot.scale.setScalar(0.16);
    logo.add(hotDot);

    // Onda de luz al terminar
    const waveMat = new THREE.MeshBasicMaterial({ color: hdr(0x7fc4ff, 1.0), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.0, 96), waveMat);
    logo.add(wave);

    for (const side of [1, -1]) {
      const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 1.5, 4, 8), M.neonWhite);
      l.rotation.z = Math.PI / 2 + side * 0.17;
      l.position.set(side * 1.32, -1.2, 0.25);
      logo.add(l);
    }

    // ============ Texto TREXYZ cromado ============
    const font = new FontLoader().parse(ORBITRON_FONT_DATA as never);
    const textGeo = new TextGeometry("TREXYZ", {
      font, size: 0.98, depth: 0.34, curveSegments: 16,
      bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.028, bevelSegments: 6,
    });
    textGeo.computeBoundingBox();
    {
      const bb = textGeo.boundingBox!;
      textGeo.translate(-(bb.max.x + bb.min.x) / 2, 0, -0.17);
    }
    const text = new THREE.Mesh(textGeo, [M.textFace, M.textSide]);
    text.position.y = -2.95;
    logo.add(text);

    const glowLine = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 4.6, 4, 8), M.neonWhite);
    glowLine.rotation.z = Math.PI / 2;
    glowLine.position.set(0, -3.18, 0.25);
    logo.add(glowLine);
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: hdr(0xffffff, 0.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.46), glowMat);
    glow.position.set(0, -3.18, 0.2);
    logo.add(glow);

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.MeshBasicMaterial({ map: glowTex, color: hdr(0x2a5fbf, 0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })
    );
    halo.renderOrder = 5;
    halo.position.set(0, 0.6, -4);
    scene.add(halo);

    // ============ Piso reflectante ============
    const FLOOR_Y = -3.42;
    const reflector = new Reflector(new THREE.PlaneGeometry(40, 40), {
      color: 0x3a4250, textureWidth: 512, textureHeight: 512, clipBias: 0.003,
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.y = FLOOR_Y;
    scene.add(reflector);
    const floorTex = canvasTex(1024, 1024, (g, w, h) => {
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.24);
      grd.addColorStop(0, "rgba(5,7,11,0.45)");
      grd.addColorStop(0.55, "rgba(5,7,11,0.75)");
      grd.addColorStop(1, "rgba(5,7,11,1)");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    floorTex.anisotropy = 8;
    const floorOverlay = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false })
    );
    floorOverlay.rotation.x = -Math.PI / 2;
    floorOverlay.position.y = FLOOR_Y + 0.004;
    scene.add(floorOverlay);

    // ============ Partículas ============
    const PN = isMobile ? 120 : 260;
    const pPos = new Float32Array(PN * 3);
    const pSpd = new Float32Array(PN);
    const pSize = new Float32Array(PN);
    const pPhase = new Float32Array(PN);
    for (let i = 0; i < PN; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 16;
      pPos[i * 3 + 1] = FLOOR_Y + Math.random() * 9;
      pPos[i * 3 + 2] = -6 + Math.random() * 8;
      pSpd[i] = 0.08 + Math.random() * 0.25;
      pSize[i] = 0.3 + Math.pow(Math.random(), 4) * 0.8;
      pPhase[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
    pGeo.setAttribute("aPhase", new THREE.BufferAttribute(pPhase, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPR: { value: PR }, uMap: { value: dotTex }, uFloor: { value: FLOOR_Y } },
      vertexShader: `attribute float aSize; attribute float aPhase;
        uniform float uTime, uPR, uFloor; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * mv;
          float tw = .45 + .55 * sin(uTime * (.7 + aPhase * .9) + aPhase * 6.2832);
          vA = tw * smoothstep(uFloor, uFloor + 1.2, position.y) * (1. - smoothstep(4., 5.5, position.y));
          gl_PointSize = aSize * uPR * (120. / -mv.z);
        }`,
      fragmentShader: `uniform sampler2D uMap; varying float vA;
        void main(){ float a = texture2D(uMap, gl_PointCoord).a * vA; gl_FragColor = vec4(vec3(.42,.7,1.) * .75, a); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ============ Postprocesado ============
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.3, 1.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ============ Controles ============
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI * 0.32;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.minAzimuthAngle = -Math.PI * 0.32;
    controls.maxAzimuthAngle = Math.PI * 0.32;
    controls.target.copy(TARGET);
    // OrbitControls fuerza touch-action:none, lo que bloquea el scroll vertical en el celular.
    // Con pan-y el dedo puede girar el logo en horizontal y la página sigue bajando en vertical.
    renderer.domElement.style.touchAction = "pan-y";
    let dragging = false;
    controls.addEventListener("start", () => (dragging = true));
    controls.addEventListener("end", () => (dragging = false));

    const pointer = new THREE.Vector2();
    let hovering = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // en táctil no hay "hover"
      const r = container.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      hovering = true;
    };
    const onLeave = () => { hovering = false; pointer.set(0, 0); };

    let anim = -1; // tiempo desde el clic (s); -1 = inactivo
    const D_OUT = 0.7, D_PRINT = 3.0, D_END = 1.1, D_ALL = D_OUT + D_PRINT + D_END;
    let downPos: [number, number] | null = null;
    const onDown = (e: PointerEvent) => { downPos = [e.clientX, e.clientY]; };
    const onUp = (e: PointerEvent) => {
      if (downPos && Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) < 6 && anim < 0) anim = 0;
      downPos = null;
      setHintVisible(false);
    };
    // Si el navegador toma el gesto para hacer scroll, cancelamos el "toque".
    const onCancel = () => { downPos = null; };
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onCancel);

    // ============ Resize (responsive) ============
    let baseDist = CAM_DIST;
    const resize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloom.resolution.set(w, h);
      reflector.getRenderTarget().setSize(Math.round(w * PR * 0.6), Math.round(h * PR * 0.6));
      camera.aspect = w / h;
      const fitAspect = 0.95;
      baseDist = w / h < fitAspect ? (CAM_DIST * fitAspect) / (w / h) : CAM_DIST;
      camera.updateProjectionMatrix();
    };
    camera.position.set(0, 1.0, CAM_DIST).add(TARGET);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(container);

    // ============ Animación ============
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sph = new THREE.Spherical();
    const tmpV = new THREE.Vector3();
    const tmpN = new THREE.Vector3();
    const tmpQ = new THREE.Quaternion();
    const nozzleW = new THREE.Vector3();
    const layerW = new THREE.Vector3();
    let hoverK = 0, spinK = 1;
    const UP = new THREE.Vector3(0, 1, 0);
    const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const smoothstep = (a: number, b: number, x: number) => {
      const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return u * u * (3 - 2 * u);
    };
    const REST_PHI = Math.PI * 0.47;
    let last = performance.now();
    let t = 0;

    renderer.setAnimationLoop((now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      t += dt;
      const mo = reduceMotion ? 0 : 1;

      const off = tmpV.copy(camera.position).sub(controls.target);
      sph.setFromVector3(off);
      if (!dragging) {
        const k = 1 - Math.pow(0.12, dt);
        sph.theta += (0 - sph.theta) * k;
        sph.phi += (REST_PHI - sph.phi) * k;
      }
      sph.radius += (baseDist - sph.radius) * 0.1;
      camera.position.copy(controls.target).add(off.setFromSpherical(sph));

      const follow = dragging ? 0 : 1;
      logo.rotation.y += (pointer.x * 0.28 * follow - logo.rotation.y) * 0.05;
      logo.rotation.x += (-pointer.y * 0.12 * follow - logo.rotation.x) * 0.05;
      logo.position.y = Math.sin(t * 1.1) * 0.07 * mo;

      hoverK += ((hovering ? 1 : 0) - hoverK) * 0.07;
      xGroup.children.forEach((g) => { g.position.x = -g.userData.side * 0.16 * hoverK; });
      M.strip.emissiveIntensity = 1.15 + hoverK * 0.5 + Math.sin(t * 2.2) * 0.12;
      M.blue.emissiveIntensity = 0.3 + hoverK * 0.15;

      // ---- Secuencia de impresión (clic / toque) ----
      let progress = 1.06, beamT = 0, sliceT = 0, drop = 0, flash = 0, waveU = -1, spinT = 1, trace = 0;
      if (anim >= 0) {
        anim += dt;
        const a = anim;
        if (a < D_OUT) {
          const u = a / D_OUT;
          progress = 1 - easeInOut(u);
          sliceT = Math.sin(u * Math.PI) * 0.6;
          drop = easeInOut(u);
          spinT = 0.25;
        } else if (a < D_OUT + D_PRINT) {
          const u = (a - D_OUT) / D_PRINT;
          progress = easeInOutSine(u);
          beamT = smoothstep(0, 0.08, u) * (1 - smoothstep(0.92, 1, u));
          sliceT = beamT;
          drop = 1;
          trace = u * Math.PI * 2 * 11;
          spinT = 0.25;
        } else if (a < D_ALL) {
          const u = (a - D_OUT - D_PRINT) / D_END;
          drop = 1 - easeInOut(u);
          flash = Math.pow(1 - u, 2.2);
          waveU = u;
          spinT = 0.25 + 0.75 * u;
        } else anim = -1;
      }
      const kf = 1 - Math.exp(-dt * 10);
      spinK += (spinT - spinK) * (1 - Math.exp(-dt * 3));
      cubeSpin.rotation.y += dt * 0.45 * spinK * mo;

      beamMat.opacity += (beamT * 0.85 - beamMat.opacity) * kf;
      dotMat.opacity += (beamT - dotMat.opacity) * kf;
      sliceMat.opacity += (sliceT * 0.45 - sliceMat.opacity) * kf;
      rimMat.opacity += (sliceT * 0.9 - rimMat.opacity) * kf;
      M.cube.emissiveIntensity = 0.3 + flash * 0.9;
      edgeMat.opacity = 0.55 + flash * 0.45;

      const layerY = -CUBE / 2 + CUBE * progress;
      layer.position.y = Math.min(layerY, CUBE / 2 - 0.003);
      logo.updateMatrixWorld();
      cube.getWorldQuaternion(tmpQ);
      tmpN.set(0, -1, 0).applyQuaternion(tmpQ);
      cube.localToWorld(layerW.set(0, layerY, 0));
      clipPlane.setFromNormalAndCoplanarPoint(tmpN, layerW);

      const cx = Math.cos(trace), cz = Math.sin(trace), m = Math.max(Math.abs(cx), Math.abs(cz));
      const q = CUBE * 0.47;
      cube.localToWorld(layerW.set((cx / m) * q, Math.min(layerY, CUBE / 2), (cz / m) * q));
      hotDot.position.copy(layerW);
      logo.worldToLocal(hotDot.position);

      const hx = anim >= 0 && anim > D_OUT ? hotDot.position.x * 0.6 : 0;
      head.position.x += (hx - head.position.x) * (1 - Math.exp(-dt * 5));
      head.position.y = HEAD_Y - 0.32 * drop;
      head.updateMatrixWorld();

      head.localToWorld(nozzleW.set(0, NOZZLE_Y, 0));
      beam.position.copy(nozzleW).add(layerW).multiplyScalar(0.5);
      logo.worldToLocal(beam.position);
      beam.scale.y = Math.max(0.01, nozzleW.distanceTo(layerW));
      beam.quaternion.setFromUnitVectors(UP, tmpV.copy(nozzleW).sub(layerW).normalize());
      beam.quaternion.premultiply(logo.getWorldQuaternion(tmpQ).invert());

      if (waveU >= 0) {
        cube.getWorldPosition(tmpV);
        logo.worldToLocal(tmpV);
        wave.position.copy(tmpV);
        wave.quaternion.copy(camera.quaternion).premultiply(logo.getWorldQuaternion(tmpQ).invert());
        wave.scale.setScalar(0.7 + easeOut(waveU) * 2.2);
        waveMat.opacity = Math.pow(1 - waveU, 2.2) * 0.35;
      } else waveMat.opacity = 0;
      M.strip.emissiveIntensity += flash * 0.6;

      tipLight.position.copy(nozzleW);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      tipGlow.scale.setScalar(1 + pulse * 0.35 + beamMat.opacity * 0.6);
      tipLight.intensity = 1.6 + pulse * 0.8 + beamMat.opacity * 2.5;
      glowMat.opacity = 0.7 + pulse * 0.3;
      underLight.intensity = 1.0 + pulse * 0.4 + flash * 2.5;
      M.neon.color.setHex(0x2f86ff).multiplyScalar(1.4 + pulse * 0.4);
      pMat.uniforms.uTime.value = t;

      const p = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PN; i++) {
        p[i * 3 + 1] += pSpd[i] * dt * mo;
        p[i * 3] += Math.sin(t * 0.5 + i) * 0.002 * mo;
        if (p[i * 3 + 1] > 5.5) p[i * 3 + 1] = FLOOR_Y;
      }
      pGeo.attributes.position.needsUpdate = true;

      controls.update();
      composer.render(dt);
    });
    const raf = requestAnimationFrame(() => setReady(true));

    return () => {
      cancelAnimationFrame(raf);
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onCancel);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      [glowTex, dotTex, layerTex, brushedTex, floorTex].forEach((tx) => tx.dispose());
      studioDisposables.forEach((d) => d.dispose());
      reflector.dispose?.();
      composer.dispose();
      rt.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Logo TREXYZ 3D: una impresora 3D fabricando un cubo"
      style={{ touchAction: "pan-y" }}
      className={cn(
        "relative min-w-0 cursor-grab select-none overflow-hidden bg-[#05070b] active:cursor-grabbing",
        // el borde del logo se funde con el fondo de la página: todo se ve como una sola pieza
        "[mask-image:radial-gradient(ellipse_at_center,#000_58%,transparent_98%)]",
        "[&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:opacity-0 [&>canvas]:transition-opacity [&>canvas]:duration-1000",
        ready && "[&>canvas]:opacity-100",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute bottom-[2%] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] text-sky-300/70 transition-opacity duration-700 sm:text-[11px]",
          !hintVisible && "opacity-0"
        )}
      >
        Arrastrá para girar · tocá para imprimir
      </span>
    </div>
  );
}

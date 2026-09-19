import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { boundsOf, clipSegment, insideLot, nearestOnLine, type Point2, type PropertyModel } from "@/lib/property-model";

export type ModelView = "model" | "plan";
export type SceneLabel = { text: string; detail?: string; point: [number, number, number]; tone?: "house" | "pipe" | "entry"; view?: ModelView };

export function createPropertyScene(canvas: HTMLCanvasElement, model: PropertyModel, onLabels: (labels: { text: string; detail?: string; x: number; y: number; tone?: string }[]) => void, onSnapshot: (url: string) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e7e8e2");
  const generator = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = generator.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  room.dispose();
  generator.dispose();
  const b = model.bounds;
  const width = b.maxX - b.minX, depth = b.maxZ - b.minZ;
  const center = new THREE.Vector3((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
  const span = Math.max(width, depth);
  const overview = () => canvas.clientWidth < 600 ? new THREE.Vector3(span * 0.38, span * 1.1, span * 1.35) : new THREE.Vector3(span * 0.95, span * 0.88, span * 1.1);
  const camera = new THREE.OrthographicCamera(-span, span, span, -span, 0.1, span * 12);
  camera.position.copy(center).add(overview());
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(center);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.minPolarAngle = 0.04;
  controls.rotateSpeed = 0.6;
  controls.update();
  canvas.style.touchAction = "pan-y";
  const light = new THREE.DirectionalLight("#fff7ed", 1.25);
  light.position.copy(center).add(new THREE.Vector3(-20, 45, 20));
  light.target.position.copy(center);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -span * 1.1, right: span * 1.1, top: span * 1.1, bottom: -span * 1.1, near: 1, far: span * 5 });
  light.shadow.normalBias = 0.06;
  light.shadow.bias = -0.0001;
  light.shadow.radius = 6;
  const hemiLight = new THREE.HemisphereLight("#f8fafc", "#cbd5e1", 1.45);
  scene.add(light, light.target, hemiLight);

  const textures: THREE.Texture[] = [];
  const material = (color: string, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  // Deterministic micro-surface relief: the colour comes from the material, not a flat illustration.
  const surface = (color: string, kind: "stone" | "grass" | "asphalt") => {
    const pixels = new Uint8Array(128 * 128 * 4);
    let seed = 731;
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const n = 90 + (seed % 95);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = n; pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 128, 128);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(kind === "grass" ? 12 : 6, kind === "grass" ? 12 : 6);
    texture.needsUpdate = true;
    textures.push(texture);
    const mat = material(color, kind === "asphalt" ? 0.96 : 0.82);
    mat.bumpMap = texture;
    mat.bumpScale = kind === "grass" ? 0.085 : 0.025;
    return mat;
  };

  // Semi-transparent architectural massing & surfaces: clear crystal look that never conceals underground utilities
  const limestone = surface("#dfdcd3", "stone");
  limestone.transparent = true; limestone.opacity = 0.52; limestone.depthWrite = false; limestone.roughness = 0.3;
  const neighborMat = material("#ccd3c8", 0.4);
  neighborMat.transparent = true; neighborMat.opacity = 0.40; neighborMat.depthWrite = false;
  const roofCapMat = material("#64747a", 0.4, 0.1);
  roofCapMat.transparent = true; roofCapMat.opacity = 0.58; roofCapMat.depthWrite = false;
  const concrete = surface("#cac9be", "stone");
  concrete.transparent = true; concrete.opacity = 0.45; concrete.depthWrite = false;
  const grass = surface("#647c56", "grass");
  grass.transparent = true; grass.opacity = 0.48; grass.depthWrite = false;
  const surroundingGround = surface("#9ba78d", "grass");
  surroundingGround.transparent = true; surroundingGround.opacity = 0.36; surroundingGround.depthWrite = false;
  const asphalt = surface("#474e52", "asphalt");
  asphalt.transparent = true; asphalt.opacity = 0.55; asphalt.depthWrite = false;
  const earth = surface("#8c7560", "stone");
  earth.transparent = true; earth.opacity = 0.18; earth.depthWrite = false;
  const lowerEarth = surface("#afa08b", "stone");
  lowerEarth.transparent = true; lowerEarth.opacity = 0.12; lowerEarth.depthWrite = false;
  const plinth = material("#3e4747", 0.7);
  plinth.transparent = true; plinth.opacity = 0.25; plinth.depthWrite = false;

  // High-saturation luminous pipe materials: constant vivid color from any angle and in both 3D & plan view
  const publicPipe = new THREE.MeshStandardMaterial({
    color: "#0284c7",
    emissive: "#06b6d4",
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.2,
    depthTest: false,
  });
  const privatePipe = new THREE.MeshStandardMaterial({
    color: "#d97706",
    emissive: "#f59e0b",
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.2,
    depthTest: false,
  });
  const terrainMaterials = [grass, surroundingGround, concrete, asphalt, earth, lowerEarth];
  const buildingMaterials = [limestone, neighborMat, roofCapMat];
  const allMaterials: THREE.Material[] = [...terrainMaterials, ...buildingMaterials, plinth, publicPipe, privatePipe];
  const roofs = new THREE.Group();
  const pipes = new THREE.Group();
  pipes.renderOrder = 999;
  pipes.visible = true;
  scene.add(roofs, pipes);
  const labels: SceneLabel[] = [];

  function add(geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D = scene) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function box(x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, parent: THREE.Object3D = scene) {
    const mesh = add(new THREE.BoxGeometry(sx, sy, sz), mat, parent); mesh.position.set(x, y, z); return mesh;
  }
  function shape(rings: Point2[][]) {
    const s = new THREE.Shape(rings[0].map(([x, z]) => new THREE.Vector2(x, -z)));
    for (const ring of rings.slice(1)) s.holes.push(new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
    return s;
  }
  function extrude(rings: Point2[][], bottom: number, height: number, mat: THREE.Material, parent: THREE.Object3D = scene, bevel = 0) {
    const g = new THREE.ExtrudeGeometry(shape(rings), { depth: height, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, steps: 1 });
    g.rotateX(-Math.PI / 2);
    const mesh = add(g, mat, parent); mesh.position.y = bottom; return mesh;
  }
  function cylinder(a: THREE.Vector3, end: THREE.Vector3, radius: number, mat: THREE.Material, parent: THREE.Object3D = scene) {
    const delta = end.clone().sub(a);
    if (delta.length() < 0.001) return;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 24), mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false; // Underground utility lines never receive shadows from above
    mesh.renderOrder = 999;
    mesh.position.copy(a).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    parent.add(mesh);
    return mesh;
  }
  function line(points: THREE.Vector3[], color: string, dashed = false, parent: THREE.Object3D = scene) {
    const mat = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.6, gapSize: 0.45, depthTest: false })
      : new THREE.LineBasicMaterial({ color, depthTest: false });
    allMaterials.push(mat);
    const mesh = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat);
    mesh.renderOrder = 999;
    if (dashed) mesh.computeLineDistances();
    parent.add(mesh); return mesh;
  }
  const stageDepth = Math.max(4.8, (model.main?.depthM ?? 3) + 1.2);
  box(center.x, -stageDepth - 0.32, center.z, width + 0.25, 0.64, depth + 0.25, plinth);
  box(center.x, -stageDepth * 0.7, center.z, width, stageDepth * 0.6, depth, lowerEarth);
  box(center.x, -stageDepth * 0.2, center.z, width, stageDepth * 0.4, depth, earth);
  box(center.x, 0.03, center.z, width, 0.12, depth, surroundingGround);
  for (const polygon of model.lot) {
    extrude(polygon, 0.10, 0.06, grass);
    line(polygon[0].map(([x, z]) => new THREE.Vector3(x, 0.19, z)), "#b39358", true);
  }

  // Actual street centerlines; pavement widths
  for (const road of model.roads) for (const part of road.parts) for (let i = 1; i < part.length; i++) {
    const segment = clipSegment(part[i - 1], part[i], b);
    if (!segment) continue;
    const [a, end] = segment;
    const length = Math.hypot(end[0] - a[0], end[1] - a[1]);
    if (length < 0.2) continue;
    const nx = (end[1] - a[1]) / length, nz = -(end[0] - a[0]) / length;
    for (const [halfWidth, elevation, thickness, mat] of [[4.6, 0.08, 0.2, concrete], [3.5, 0.28, 0.05, asphalt]] as const) {
      let strip: Point2[] = [[a[0] + nx * halfWidth, a[1] + nz * halfWidth], [end[0] + nx * halfWidth, end[0] + nz * halfWidth], [end[0] - nx * halfWidth, end[1] - nz * halfWidth], [a[0] - nx * halfWidth, a[1] - nz * halfWidth]];
      strip = clipPolygon(clipPolygon(clipPolygon(clipPolygon(strip, 0, b.minX, true), 0, b.maxX, false), 1, b.minZ, true), 1, b.maxZ, false);
      if (strip.length >= 3) extrude([strip], elevation, thickness, mat);
    }
  }

  // Pure architectural massing block for buildings based strictly on mapped GIS polygons
  for (const building of model.buildings) {
    const bb = boundsOf(building.rings[0]);
    if (bb.minX < b.minX + 0.5 || bb.maxX > b.maxX - 0.5 || bb.minZ < b.minZ + 0.5 || bb.maxZ > b.maxZ - 0.5) continue;
    const primary = building.id === model.primary?.id;
    const height = building.accessory ? 2.8 : primary ? 4.8 : 3.8;
    const walls = primary ? limestone : neighborMat;

    // Plinth foundation
    extrude(building.rings, 0.16, 0.35, concrete);
    // Massing body with subtle micro-bevel
    extrude(building.rings, 0.51, height, walls, scene, 0.04);
    // Crisp architectural parapet / roof cap
    extrude(building.rings, height + 0.51, 0.22, roofCapMat, roofs, 0.06);
  }

  // Subtle dimension leaders on the footprint, only in Top view
  if (model.houseBounds) {
    const h = model.houseBounds;
    const z = h.maxZ + 2.1, x = h.minX - 2.1;
    line([new THREE.Vector3(h.minX, 0.45, z), new THREE.Vector3(h.maxX, 0.45, z)], "#52676c");
    line([new THREE.Vector3(x, 0.45, h.minZ), new THREE.Vector3(x, 0.45, h.maxZ)], "#52676c");
    for (const xx of [h.minX, h.maxX]) line([new THREE.Vector3(xx, 0.45, z - 0.45), new THREE.Vector3(xx, 0.45, z + 0.45)], "#52676c");
    for (const zz of [h.minZ, h.maxZ]) line([new THREE.Vector3(x - 0.45, 0.45, zz), new THREE.Vector3(x + 0.45, 0.45, zz)], "#52676c");
    labels.push({ text: `${model.widthFt!.toFixed(0)}′`, point: [(h.minX + h.maxX) / 2, 0.6, z + 1.2], view: "plan" });
    labels.push({ text: `${model.depthFt!.toFixed(0)}′`, point: [x - 1.2, 0.6, (h.minZ + h.maxZ) / 2], view: "plan" });
  }

  // Underground sewer pipes: public main + private lateral line
  if (model.main) {
    const y = -(model.main.depthM ?? 3);
    const radius = Math.max(0.48, Math.min(model.main.radiusM ?? 0.48, 1.2)); // visually prominent pipe scale
    let mainVisible = false;
    for (const part of model.main.parts) for (let i = 1; i < part.length; i++) {
      const segment = clipSegment(part[i - 1], part[i], b);
      if (segment) {
        const [a, end] = segment;
        cylinder(new THREE.Vector3(a[0], y, a[1]), new THREE.Vector3(end[0], y, end[1]), radius, publicPipe, pipes);
        // Add ground projection trace line directly above the pipe
        line([new THREE.Vector3(a[0], 0.22, a[1]), new THREE.Vector3(end[0], 0.22, end[1])], "#06b6d4", true, pipes);
        // Vertical depth drops at ends for spatial depth clarity
        line([new THREE.Vector3(a[0], y, a[1]), new THREE.Vector3(a[0], 0.22, a[1])], "#06b6d4", true, pipes);
        line([new THREE.Vector3(end[0], y, end[1]), new THREE.Vector3(end[0], 0.22, end[1])], "#06b6d4", true, pipes);
        mainVisible = true;
      }
    }

    if (mainVisible && model.houseBounds) {
      const h = model.houseBounds;
      const start2: Point2 = [(h.minX + h.maxX) / 2, (h.minZ + h.maxZ) / 2];
      const target = nearestOnLine(start2, model.main.parts);
      if (target && target[0] >= b.minX && target[0] <= b.maxX && target[1] >= b.minZ && target[1] <= b.maxZ) {
        const start = new THREE.Vector3(start2[0], -0.8, start2[1]);
        const end = new THREE.Vector3(target[0], y, target[1]);
        // Solid continuous private lateral pipe: stays clearly visible through transparent foundation
        cylinder(start, end, 0.28, privatePipe, pipes);
        // House vertical outlet stub
        cylinder(new THREE.Vector3(start2[0], 0.25, start2[1]), start, 0.24, privatePipe, pipes);
        // Surface alignment guide
        line([new THREE.Vector3(start2[0], 0.22, start2[1]), new THREE.Vector3(target[0], 0.22, target[1])], "#f59e0b", true, pipes);
      }
    }
  }

  // Geographic north
  const arrowAt = new THREE.Vector3(b.maxX - 3, 0.5, b.maxZ - 3);
  const direction = new THREE.Vector3(model.north[0], 0, model.north[1]).normalize();
  const arrow = new THREE.ArrowHelper(direction, arrowAt, 3.5, "#344e55", 0.9, 0.6);
  scene.add(arrow);
  labels.push({ text: "N", point: arrowAt.clone().addScaledVector(direction, 4.5).toArray() as [number, number, number] });

  let view: ModelView = "model";
  let frame = 0, disposed = false;
  function render() {
    if (disposed) return;
    renderer.render(scene, camera);
    const rect = canvas.getBoundingClientRect();
    const occupied: { x: number; y: number; width: number; height: number }[] = [];
    const visibleLabels = labels.filter(l => !l.view || l.view === view);
    visibleLabels.sort((a, b) => Number(b.text === "N") - Number(a.text === "N") || Number(b.view === view) - Number(a.view === view));
    const placed = visibleLabels.flatMap(label => {
      const p = new THREE.Vector3(...label.point).project(camera);
      const labelWidth = Math.min(240, Math.max(label.text.length * 7, rect.width < 600 ? 0 : (label.detail?.length ?? 0) * 5.5) + 22);
      const labelHeight = label.detail && rect.width >= 600 ? 43 : 29;
      const rawX = (p.x + 1) / 2 * rect.width, y = (1 - p.y) / 2 * rect.height;
      if (p.z > 1 || rawX < 0 || rawX > rect.width || y < labelHeight || y > rect.height - 24) return [];
      const x = Math.max(labelWidth / 2 + 7, Math.min(rect.width - labelWidth / 2 - 7, rawX));
      if (occupied.some(o => Math.abs(o.x - x) < (o.width + labelWidth) / 2 + 5 && Math.abs(o.y - y) < Math.max(o.height, labelHeight) + 4)) return [];
      occupied.push({ x, y, width: labelWidth, height: labelHeight });
      return [{ text: label.text, detail: rect.width < 600 ? undefined : label.detail, x, y, tone: label.tone }];
    });
    onLabels(placed);
  }
  function requestRender() { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }
  function fit() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.updateMatrixWorld();
    const corners = [];
    for (const x of [b.minX, b.maxX]) for (const y of [-stageDepth - 0.7, 8]) for (const z of [b.minZ, b.maxZ]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
    const bb = new THREE.Box3().setFromPoints(corners);
    const aspect = rect.width / rect.height;
    const half = Math.max(Math.abs(bb.min.y), Math.abs(bb.max.y), Math.abs(bb.min.x) / aspect, Math.abs(bb.max.x) / aspect) * 1.08;
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix(); render();
  }
  controls.addEventListener("change", requestRender);
  const observer = new ResizeObserver(fit); observer.observe(canvas);
  fit();
  onSnapshot(canvas.toDataURL("image/png"));
  const beforePrint = () => { render(); onSnapshot(canvas.toDataURL("image/png")); };
  window.addEventListener("beforeprint", beforePrint);

  return {
    setView(next: ModelView) {
      view = next;
      // Pipes are always visible in both 3D and Top View
      pipes.visible = true;
      if (next === "plan") {
        // Plan view: maximum luminance emissive for crisp engineering schematic feel
        publicPipe.emissiveIntensity = 0.95;
        privatePipe.emissiveIntensity = 0.95;
      } else {
        publicPipe.emissiveIntensity = 0.65;
        privatePipe.emissiveIntensity = 0.65;
      }
      camera.position.copy(center).add(next === "plan" ? new THREE.Vector3(0, span * 1.6, 0.01) : overview());
      camera.zoom = 1; controls.update(); fit();
      onSnapshot(canvas.toDataURL("image/png"));
    },
    zoom(factor: number) { camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, 0.7, 2.4); camera.updateProjectionMatrix(); render(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      window.removeEventListener("beforeprint", beforePrint);
      const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(allMaterials);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometry.add(object.geometry);
          for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
        }
      });
      geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      light.shadow.dispose(); environment.dispose(); renderer.dispose();
    },
  };
}


function clipPolygon(points: Point2[], axis: 0 | 1, edge: number, keepGreater: boolean): Point2[] {
  const result: Point2[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const aIn = keepGreater ? a[axis] >= edge : a[axis] <= edge;
    const bIn = keepGreater ? b[axis] >= edge : b[axis] <= edge;
    if (aIn) result.push(a);
    if (aIn !== bIn) {
      const t = (edge - a[axis]) / (b[axis] - a[axis]);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

// Mock Three.js for testing
export const WebGLRenderer = jest.fn().mockImplementation(() => ({
  setSize: jest.fn(),
  render: jest.fn(),
  dispose: jest.fn(),
  domElement: document.createElement('canvas'),
  setPixelRatio: jest.fn(),
  setClearColor: jest.fn(),
  shadowMap: {
    enabled: false,
    type: 'PCFSoftShadowMap',
  },
}));

export const Scene = jest.fn().mockImplementation(() => ({
  add: jest.fn(),
  remove: jest.fn(),
  children: [],
  background: null,
}));

export const PerspectiveCamera = jest.fn().mockImplementation(() => ({
  position: {
    set: jest.fn(),
    x: 0,
    y: 0,
    z: 0,
  },
  lookAt: jest.fn(),
  aspect: 1,
  near: 0.1,
  far: 1000,
  updateProjectionMatrix: jest.fn(),
}));

export const Mesh = jest.fn().mockImplementation(() => ({
  position: { set: jest.fn() },
  rotation: { set: jest.fn() },
  scale: { set: jest.fn() },
  material: {},
  geometry: {},
  userData: {},
}));

export const MeshBasicMaterial = jest.fn().mockImplementation(() => ({
  color: { set: jest.fn() },
  transparent: false,
  opacity: 1,
}));

export const MeshStandardMaterial = jest.fn().mockImplementation(() => ({
  color: { set: jest.fn() },
  metalness: 0,
  roughness: 1,
  transparent: false,
  opacity: 1,
}));

export const SphereGeometry = jest.fn().mockImplementation(() => ({
  radius: 1,
  widthSegments: 8,
  heightSegments: 6,
}));

export const PlaneGeometry = jest.fn().mockImplementation(() => ({
  width: 1,
  height: 1,
}));

export const Vector3 = jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
  x,
  y,
  z,
  set: jest.fn(),
  copy: jest.fn(),
  add: jest.fn(),
  sub: jest.fn(),
  multiply: jest.fn(),
  normalize: jest.fn(),
  length: jest.fn(() => 1),
  distanceTo: jest.fn(() => 1),
}));

export const Vector2 = jest.fn().mockImplementation((x = 0, y = 0) => ({
  x,
  y,
  set: jest.fn(),
  copy: jest.fn(),
}));

export const Raycaster = jest.fn().mockImplementation(() => ({
  setFromCamera: jest.fn(),
  intersectObjects: jest.fn(() => []),
  ray: {
    origin: new Vector3(),
    direction: new Vector3(),
  },
}));

export const Clock = jest.fn().mockImplementation(() => ({
  getElapsedTime: jest.fn(() => 0),
  getDelta: jest.fn(() => 0.016),
}));

export const Color = jest.fn().mockImplementation((color = 0xffffff) => ({
  r: 1,
  g: 1,
  b: 1,
  set: jest.fn(),
  setHex: jest.fn(),
  setRGB: jest.fn(),
}));

export const DirectionalLight = jest.fn().mockImplementation(() => ({
  position: { set: jest.fn() },
  intensity: 1,
  color: new Color(),
  castShadow: false,
}));

export const AmbientLight = jest.fn().mockImplementation(() => ({
  color: new Color(),
  intensity: 1,
}));

export const OrbitControls = jest.fn().mockImplementation(() => ({
  enableDamping: true,
  dampingFactor: 0.05,
  update: jest.fn(),
  dispose: jest.fn(),
}));

// Mock for texture loading
export const TextureLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn((url, onLoad) => {
    const mockTexture = {
      image: { width: 100, height: 100 },
      needsUpdate: true,
    };
    if (onLoad) onLoad(mockTexture);
    return mockTexture;
  }),
}));

// Mock for GLTF loader
export const GLTFLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn((url, onLoad) => {
    const mockGLTF = {
      scene: new Scene(),
      animations: [],
      asset: {},
    };
    if (onLoad) onLoad(mockGLTF);
    return mockGLTF;
  }),
}));

// Animation mixer mock
export const AnimationMixer = jest.fn().mockImplementation(() => ({
  clipAction: jest.fn(() => ({
    play: jest.fn(),
    stop: jest.fn(),
    setLoop: jest.fn(),
  })),
  update: jest.fn(),
}));

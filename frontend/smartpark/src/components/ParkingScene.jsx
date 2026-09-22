import { memo, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeContext';

const BAY_W = 3;
const BAY_L = 5.6;
const GAP = 0.22;
const AISLE = 6.4;

// Physical dimensions for 3D parking scene (in Blender/Three.js units)
// These determine the actual parking space size per vehicle class
const BAY_DIMS = {
  SMALL: { width: 1.4, length: 2.6 },   // TWO_WHEELER — narrow
  MEDIUM: { width: 2.5, length: 5.0 },  // CAR — medium rectangular
  LARGE: { width: 3.5, length: 7.0 },   // HEAVY_VEHICLE — long/wide
};

const SIZE_RATE = { SMALL: 10, MEDIUM: 20, LARGE: 40 };
const SIZE_VEHICLE = {
  SMALL: 'Two-wheeler',
  MEDIUM: 'Car',
  LARGE: 'Heavy vehicle',
};

/* ---------- stylized low-poly car ---------- */
function Car({ color = '#8a93a6', dark }) {
  const glass = dark ? '#0b1526' : '#20314f';
  return (
    <group>
      {/* body */}
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[1.9, 0.62, 4.1]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.45} />
      </mesh>
      {/* cabin */}
      <mesh castShadow position={[0, 1.14, -0.25]}>
        <boxGeometry args={[1.65, 0.55, 2.1]} />
        <meshStandardMaterial color={glass} roughness={0.15} metalness={0.6} />
      </mesh>
      {/* wheels */}
      {[
        [-0.95, 0.35, 1.35],
        [0.95, 0.35, 1.35],
        [-0.95, 0.35, -1.35],
        [0.95, 0.35, -1.35],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.28, 18]} />
          <meshStandardMaterial color="#15181f" roughness={0.8} />
        </mesh>
      ))}
      {/* headlights */}
      {[
        [-0.6, 0.66, 2.06],
        [0.6, 0.66, 2.06],
      ].map((p, i) => (
        <mesh key={`h${i}`} position={p}>
          <boxGeometry args={[0.34, 0.14, 0.06]} />
          <meshStandardMaterial
            color="#fff6d8"
            emissive="#ffedb0"
            emissiveIntensity={dark ? 1.4 : 0.5}
          />
        </mesh>
      ))}
      {/* taillights */}
      <mesh position={[0, 0.66, -2.06]}>
        <boxGeometry args={[1.5, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#7a1d1d"
          emissive="#c23b3b"
          emissiveIntensity={dark ? 1 : 0.4}
        />
      </mesh>
    </group>
  );
}

/* ---------- stylized motorcycle ---------- */
function Motorcycle({ color = '#8a93a6', dark }) {
  const glass = dark ? '#0b1526' : '#20314f';
  return (
    <group>
      {/* frame */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.2, 0.3, 8.5]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>
      {/* seat */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[2.0, 0.2, 0.8]} />
        <meshStandardMaterial color={glass} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* front wheel */}
      <mesh castShadow position={[-0.9, 0.25, 3.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.5, 12]} />
        <meshStandardMaterial color="#15181f" roughness={0.9} />
      </mesh>
      {/* rear wheel */}
      <mesh castShadow position={[0.9, 0.25, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.5, 12]} />
        <meshStandardMaterial color="#15181f" roughness={0.9} />
      </mesh>
      {/* handlebar */}
      <mesh castShadow position={[0, 1.1, 3.5]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.2, 1.5]} />
        <meshStandardMaterial color="#15181f" roughness={0.9} />
      </mesh>
      {/* exhaust */}
      <mesh position={[1.8, 0.4, -1.5]}>
        <coneGeometry args={[0.3, 0.5, 0.8, 8]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ---------- stylized heavy vehicle ---------- */
function HeavyVehicle({ color = '#5a2326', dark }) {
  const glass = dark ? '#0b1526' : '#20314f';
  return (
    <group>
      {/* cabin */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[2.5, 1.3, 6.0]} />
        <meshStandardMaterial color={glass} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* cargo bed */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[3.2, 0.5, 4.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* wheels */}
      {[
        [-1.2, 0.55, 2.3],
        [1.2, 0.55, 2.3],
        [-1.2, 0.55, -2.3],
        [1.2, 0.55, -2.3],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 0.8, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
      {/* headlights */}
      {[
        [-0.8, 1.5, 2.8],
        [0.8, 1.5, 2.8],
      ].map((p, i) => (
        <mesh key={`h${i}`} position={p}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshStandardMaterial
            color="#fff6d8"
            emissive="#ffedb0"
            emissiveIntensity={dark ? 1.2 : 0.4}
          />
        </mesh>
      ))}
      {/* taillights */}
      <mesh position={[0, 1.3, -2.8]}>
        <boxGeometry args={[1.8, 0.2, 0.15]} />
        <meshStandardMaterial
          color="#7a1d1d"
          emissive="#c23b3b"
          emissiveIntensity={dark ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
}

/* ---------- single parking bay ---------- */
const Bay = memo(function Bay({
  slot,
  position,
  rotationY,
  selected,
  current,
  hovered,
  onHover,
  onSelect,
  dark,
  vehicleType,
}) {
  const group = useRef();
  const occupied = slot.status === 'OCCUPIED';
  const base = occupied
    ? dark
      ? '#5a2326'
      : '#e8c9c9'
    : dark
      ? '#1c2947'
      : '#dfe4ee';
  const frame = base;

  // Use slot size to determine physical bay dimensions
  const slotSize = slot.size ?? 'MEDIUM';
  const bayWidth = BAY_DIMS[slotSize].width;
  const bayLength = BAY_DIMS[slotSize].length;

  useFrame((_, dt) => {
    if (!group.current) return;
    const target = hovered && !occupied ? 1.06 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, 1, target), dt * 10);
  });

  // Compute vehicle type: prop > slot.size fallback > default MEDIUM→CAR
  const vehicle_type =
    vehicleType ??
    (slotSize === 'SMALL'
      ? 'TWO_WHEELER'
      : slotSize === 'MEDIUM'
        ? 'CAR'
        : 'HEAVY_VEHICLE');

  // Proportional vehicle scaling per bay size & vehicle type
  // These percentages ensure vehicles fit inside their bay and don't overlap neighbors
  const vehicleProportions = {
    TWO_WHEELER: { lengthRatio: 0.7, widthRatio: 0.53 },  // 70% length, 53% width
    CAR: { lengthRatio: 0.75, widthRatio: 0.7 },          // 75% length, 70% width
    HEAVY_VEHICLE: { lengthRatio: 0.75, widthRatio: 0.75 }, // 75% length, 75% width
  };
  const vp = vehicleProportions[vehicle_type] || vehicleProportions.CAR;

  // Vehicle model mapping
  const vehicleModel = occupied && vehicle_type
    ? vehicle_type === 'TWO_WHEELER'
      ? <Motorcycle color={pickCarColor(slot.id)} dark={dark} />
      : vehicle_type === 'HEAVY_VEHICLE'
        ? <HeavyVehicle color={pickCarColor(slot.id)} dark={dark} />
        : <Car color={pickCarColor(slot.id)} dark={dark} />
    : null;

  // Vehicle position: centered in bay, small offset above surface
  const vehicleOffsetY = 0.04; // tiny lift to prevent z-fighting
  const vehiclePosition = [
    position[0], // x stays as passed (bay center)
    vehicleOffsetY,
    position[2], // z stays as passed (bay center)
  ];

  // Scale vehicle so it occupies the specified % of bay dimensions
  // We compute scale factors based on bay dimensions and proportion ratios
  const vehicleScaleX = (bayWidth / 2) * vp.widthRatio * 2; // full width extent
  const vehicleScaleZ = (bayLength / 2) * vp.lengthRatio * 2; // full length extent

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          if (!occupied) onSelect?.(slot);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!occupied) {
            document.body.style.cursor = 'pointer';
            onHover?.(slot.id);
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          onHover?.(null);
        }}
      >
        {/* bay floor — uses size-differentiated dimensions */}
        <mesh receiveShadow position={[0, 0.02, 0]}>
          <boxGeometry args={[bayWidth, 0.04, bayLength]} />
          <meshStandardMaterial
            color={base}
            roughness={0.9}
            emissive={hovered && !occupied ? (dark ? '#6c8dff' : '#3b5bdb') : '#000'}
            emissiveIntensity={hovered && !occupied ? 0.28 : 0}
          />
        </mesh>
        {/* painted frame: sides + back */}
        {[
          [-bayWidth / 2, 0.045, 0, 0.12 * (bayWidth / 3), bayLength],
          [bayWidth / 2, 0.045, 0, 0.12 * (bayWidth / 3), bayLength],
          [0, 0.045, -bayLength / 2, bayWidth + 0.12 * (bayWidth / 3), 0.12],
        ].map((s, i) => (
          <mesh key={i} position={[s[0], s[1], s[2]]}>
            <boxGeometry args={[s[3], 0.02, s[4]]} />
          <meshStandardMaterial color={base} roughness={0.7} />
          </mesh>
        ))}
        {/* status edge glow */}
        <mesh position={[0, 0.045, bayLength / 2]}>
          <boxGeometry args={[bayWidth, 0.025, 0.14]} />
          <meshStandardMaterial
            color={frame}
            emissive={frame}
            emissiveIntensity={selected || current ? 0.9 : 0.45}
          />
        </mesh>
        {/* wheel stop */}
        <mesh castShadow position={[0, 0.14, -bayLength / 2 + 0.7]}> 
          // 0.7 is a small offset so it clears the bay surface
          <boxGeometry args={[bayWidth - 0.2, 0.22, 0.24]} /> // narrowed to stay inside bay
          <meshStandardMaterial color={dark ? '#2c3a5c' : '#b9c1d4'} roughness={0.8} />
        </mesh>
        {/* bay number plate */}
        <Html
          position={[0, 0.06, bayLength / 2 - 0.75]}
          rotation={[-Math.PI / 2, 0, 0]}
          center
          occlude
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '0.06em',
              color: dark ? '#dbe2f2' : '#3c4356',
              opacity: 0.9,
            }}
          >
            {slot.slotNumber}
          </div>
        </Html>
        {/* occupied vehicle — positioned & scaled per bay size */}
        {occupied && (
          <group position={vehiclePosition} scale={[
            vehicleScaleX / (bayWidth / 2), // normalize to ±1 range
            1,
            vehicleScaleZ / (bayLength / 2),
          ]}>
            {vehicleModel}
          </group>
        )}
        {/* hover tooltip */}
        {hovered && !occupied && (
          <Html position={[0, 2.4, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="slot-tip">
              <strong>{slot.slotNumber}</strong> · {slot.size}
              <br />
              {SIZE_VEHICLE[slot.size] ?? ''} · ₹{SIZE_RATE[slot.size] ?? 20}/hr
              <br />
              Click to select
            </div>
          </Html>
        )}
      </group>
    </group>
  );
});

function pickCarColor(id) {
  const palette = ['#5b6b8c', '#7d8aa5', '#3f5a52', '#6e5a7e', '#8c6a4a', '#445066'];
  return palette[Number(id ?? 0) % palette.length];
}

/* ---------- lamp post ---------- */
function Lamp({ position, dark }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 4.8, 10]} />
        <meshStandardMaterial color={dark ? '#2b3550' : '#4a5266'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.9, 0]}>
        <boxGeometry args={[0.7, 0.22, 0.7]} />
        <meshStandardMaterial
          color="#fff3cf"
          emissive="#ffe9a8"
          emissiveIntensity={dark ? 2.2 : 0.9}
        />
      </mesh>
      <pointLight
        position={[0, 4.6, 0]}
        intensity={dark ? 22 : 6}
        distance={16}
        color="#ffe9b8"
      />
    </group>
  );
}

/* ---------- low-poly tree ---------- */
function Tree({ position, dark }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 1, 8]} />
        <meshStandardMaterial color="#5d4a36" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <coneGeometry args={[0.95, 1.9, 8]} />
        <meshStandardMaterial color={dark ? '#1e5c44' : '#2e7d5b'} roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ---------- entry sign ---------- */
function EntrySign() {
  // The sign board and text share ONE parent group so the text
  // stays physically attached to the board under any camera rotation.
  return (
    <group position={[0, 0, 11.4]} receiveShadow>
      {/* black rectangular board */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[4.4, 1, 0.24]} />
        <meshStandardMaterial color="#16213a" roughness={0.5} />
      </mesh>
      {/* AU MAIN PARKING text — positioned relative to the board front */}
      <Html
        position={[0, 0.5, 0.14]} // local: slightly above centre, in front of board
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            fontFamily: 'Sora, Inter, sans-serif',
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: '0.12em',
            color: '#fff',
            whiteSpace: 'nowrap',
          }}
        >
          AU MAIN PARKING
        </div>
      </Html>
    </group>
  );
}

/* ---------- scene root ---------- */
function LotScene({ slots, selectedId, activeSlotId, onSelect }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [hoverId, setHoverId] = useState(null);

  const rows = useMemo(() => {
    const sorted = [...(slots ?? [])].sort((a, b) =>
      String(a.slotNumber).localeCompare(String(b.slotNumber)),
    );
    return { back: sorted.slice(0, 5), front: sorted.slice(5, 10) };
  }, [slots]);

  const rowWidth = 5 * (BAY_W + GAP);
  const groundW = rowWidth + 14;
  const groundL = BAY_L * 2 + AISLE + 12;
  const backZ = -(AISLE / 2 + BAY_L / 2);
  const frontZ = AISLE / 2 + BAY_L / 2;

  const bayX = (i) => -rowWidth / 2 + BAY_W / 2 + i * (BAY_W + GAP);

  return (
    <>
      <color attach="background" args={[dark ? '#0e1320' : '#eceae2']} />
      <fog attach="fog" args={[dark ? '#0e1320' : '#eceae2', 42, 78]} />
      <hemisphereLight
        args={[dark ? '#8aa0d8' : '#fff8e8', dark ? '#11182b' : '#8f8a7c', dark ? 0.5 : 0.75]}
      />
      <directionalLight
        castShadow
        position={[14, 20, 10]}
        intensity={dark ? 0.9 : 1.6}
        color={dark ? '#cdd9ff' : '#fff2dc'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      {/* asphalt base */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[groundW, groundL]} />
        <meshStandardMaterial color={dark ? '#161d31' : '#3f4552'} roughness={0.95} />
      </mesh>
      {/* surrounding ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[groundW + 40, groundL + 40]} />
        <meshStandardMaterial color={dark ? '#0b1120' : '#d9d5c8'} roughness={1} />
      </mesh>
      {/* central aisle guide dashes */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[-12 + i * 4, 0.02, 0]}>
          <boxGeometry args={[1.8, 0.02, 0.18]} />
          <meshStandardMaterial color={dark ? '#8a93ad' : '#f4f1e6'} roughness={0.7} />
        </mesh>
      ))}

      {/* bays */}
      {rows.back.map((s, i) => (
        <Bay
          key={s.id}
          slot={s}
          position={[bayX(i), 0, backZ]}
          rotationY={0}
          selected={s.id === selectedId}
          current={s.id === activeSlotId}
          hovered={hoverId === s.id}
          onHover={setHoverId}
          onSelect={onSelect}
          dark={dark}
        />
      ))}
      {rows.front.map((s, i) => (
        <Bay
          key={s.id}
          slot={s}
          position={[bayX(i), 0, frontZ]}
          rotationY={Math.PI}
          selected={s.id === selectedId}
          current={s.id === activeSlotId}
          hovered={hoverId === s.id}
          onHover={setHoverId}
          onSelect={onSelect}
          dark={dark}
        />
      ))}

      <EntrySign />
      <Lamp position={[-rowWidth / 2 - 3.4, 0, 0]} dark={dark} />
      <Lamp position={[rowWidth / 2 + 3.4, 0, 0]} dark={dark} />
      <Tree position={[-rowWidth / 2 - 3.4, 0, 8]} dark={dark} />
      <Tree position={[rowWidth / 2 + 3.4, 0, -8]} dark={dark} />
      <Tree position={[rowWidth / 2 + 3.4, 0, 8.6]} dark={dark} />

      <ContactShadows position={[0, 0.01, 0]} scale={44} blur={2.2} far={6}
        opacity={dark ? 0.65 : 0.42} color="#000" />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={12}
        maxDistance={46}
        maxPolarAngle={Math.PI / 2.45}
        minPolarAngle={Math.PI / 5}
        target={[0, 0.6, 0]}
      />
    </>
  );
}

/* ---------- public component ---------- */
export default function ParkingScene({
  slots,
  selectedId,
  activeSlotId,
  onSelect,
  height,
}) {
  if (!slots || slots.length === 0) return null;
  return (
    <div className="scene-canvas" style={height ? { height } : undefined}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [15, 13.5, 19], fov: 42 }}
        gl={{ antialias: true }}
      >
        <LotScene
          slots={slots}
          selectedId={selectedId}
          activeSlotId={activeSlotId}
          onSelect={onSelect}
        />
      </Canvas>
    </div>
  );
}

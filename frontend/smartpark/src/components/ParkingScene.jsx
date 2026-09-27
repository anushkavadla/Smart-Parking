import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../theme/ThemeContext';
import { levelCodeOf, levelTag, normalizeStatus } from '../utils/levels';
import { BAY_DIMS, computeLayout, sizeOf } from '../utils/parkingLayout';

const STATUS_COLOR = {
  AVAILABLE: '#22c55e',
  OCCUPIED: '#ef4444',
  SELECTED: '#3b82f6',
  ACTIVE: '#f59e0b',
  RESERVED: '#eab308',
  OUT_OF_SERVICE: '#6b7280',
};

const VEHICLE_PALETTE = ['#7d8aa5', '#5b6b8c', '#3f5a52', '#6e5a7e', '#8c6a4a', '#445066'];

/* ------------------------- vehicle models ------------------------- */
/* All models face +Z, are centred on the origin and sit on y = 0.    */

function Car({ color = '#7d8aa5', dark }) {
  const glass = dark ? '#0b1526' : '#20314f';
  return (
    <group>
      <mesh castShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[1.8, 0.55, 4.1]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh castShadow position={[0, 1.08, -0.2]}>
        <boxGeometry args={[1.6, 0.5, 2.0]} />
        <meshStandardMaterial color={glass} roughness={0.15} metalness={0.6} />
      </mesh>
      {[
        [-0.85, 0.32, 1.32],
        [0.85, 0.32, 1.32],
        [-0.85, 0.32, -1.32],
        [0.85, 0.32, -1.32],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.26, 16]} />
          <meshStandardMaterial color="#14171e" roughness={0.85} />
        </mesh>
      ))}
      {[
        [-0.55, 0.6, 2.06],
        [0.55, 0.6, 2.06],
      ].map((p, i) => (
        <mesh key={`h${i}`} position={p}>
          <boxGeometry args={[0.32, 0.13, 0.06]} />
          <meshStandardMaterial
            color="#fff6d8"
            emissive="#ffedb0"
            emissiveIntensity={dark ? 1.3 : 0.45}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.6, -2.06]}>
        <boxGeometry args={[1.4, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#7a1d1d"
          emissive="#c23b3b"
          emissiveIntensity={dark ? 0.9 : 0.35}
        />
      </mesh>
    </group>
  );
}

function Motorcycle({ color = '#46536e', dark }) {
  // Footprint budget (SMALL bay is 1.4 × 2.6, neighbour pads 1.4 away):
  // max half-width 0.36, z extent ±1.02 — centred with margin preserved.
  return (
    <group>
      {[
        [0, 0.34, 0.68],
        [0, 0.34, -0.68],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.2, 16]} />
          <meshStandardMaterial color="#14171e" roughness={0.9} />
        </mesh>
      ))}
      {/* light hubs so the two wheels read at facility zoom */}
      {[
        [0, 0.34, 0.68],
        [0, 0.34, -0.68],
      ].map((p, i) => (
        <mesh key={`hub${i}`} position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.22, 12]} />
          <meshStandardMaterial color="#9aa3b5" roughness={0.45} metalness={0.5} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[0.5, 0.34, 1.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.45}
          metalness={0.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.78, -0.28]}>
        <boxGeometry args={[0.44, 0.14, 0.6]} />
        <meshStandardMaterial color="#1c2230" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.6, 0.66]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.07, 0.66, 0.07]} />
        <meshStandardMaterial color="#9aa3b5" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* front fairing/windscreen: taller silhouette reads at distance */}
      <mesh castShadow position={[0, 1.0, 0.62]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.38, 0.44, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      <mesh castShadow position={[0, 0.92, 0.55]}>
        <boxGeometry args={[0.72, 0.07, 0.07]} />
        <meshStandardMaterial color="#14171e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.72, 0.72]}>
        <boxGeometry args={[0.16, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#fff6d8"
          emissive="#ffedb0"
          emissiveIntensity={dark ? 1.2 : 0.4}
        />
      </mesh>
      <mesh position={[0, 0.6, -0.72]}>
        <boxGeometry args={[0.14, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#7a1d1d"
          emissive="#c23b3b"
          emissiveIntensity={dark ? 0.9 : 0.35}
        />
      </mesh>
    </group>
  );
}

function HeavyVehicle({ color = '#8a93a6', dark }) {
  const glass = dark ? '#0b1526' : '#20314f';
  return (
    <group>
      <mesh castShadow position={[0, 1.35, -1.05]}>
        <boxGeometry args={[2.5, 1.7, 4.1]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 1.0, 2.0]}>
        <boxGeometry args={[2.4, 1.4, 1.7]} />
        <meshStandardMaterial color="#39445c" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, 2.86]}>
        <boxGeometry args={[2.1, 0.6, 0.08]} />
        <meshStandardMaterial color={glass} roughness={0.15} metalness={0.6} />
      </mesh>
      {[
        [-1.15, 0.45, 2.0],
        [1.15, 0.45, 2.0],
        [-1.15, 0.45, -0.4],
        [1.15, 0.45, -0.4],
        [-1.15, 0.45, -2.2],
        [1.15, 0.45, -2.2],
      ].map((p, i) => (
        <mesh key={i} castShadow position={p} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.35, 14]} />
          <meshStandardMaterial color="#16181d" roughness={0.9} />
        </mesh>
      ))}
      {[
        [-0.8, 0.85, 2.86],
        [0.8, 0.85, 2.86],
      ].map((p, i) => (
        <mesh key={`h${i}`} position={p}>
          <boxGeometry args={[0.36, 0.18, 0.08]} />
          <meshStandardMaterial
            color="#fff6d8"
            emissive="#ffedb0"
            emissiveIntensity={dark ? 1.1 : 0.4}
          />
        </mesh>
      ))}
      <mesh position={[0, 1.1, -3.11]}>
        <boxGeometry args={[1.9, 0.18, 0.08]} />
        <meshStandardMaterial
          color="#7a1d1d"
          emissive="#c23b3b"
          emissiveIntensity={dark ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
}

/* ------------------------- ground labels -------------------------- */
/* Synchronous canvas-texture labels (flat "paint" on the asphalt).   */
/* Deliberately NOT troika/drei Text: troika loads fonts and builds   */
/* SDF glyphs asynchronously in a worker (~0.5s after mount) and any  */
/* failure there unmounts the whole Canvas root (blank canvas while   */
/* the surrounding page stays up). CanvasTexture is fully synchronous. */

function makeLabelTexture(str, color, opacity) {
  const fontSize = 64;
  const pad = 12;
  const font = `700 ${fontSize}px Inter, system-ui, Segoe UI, sans-serif`;
  const measurer = document.createElement('canvas').getContext('2d');
  measurer.font = font;
  const w = Math.max(8, Math.ceil(measurer.measureText(str).width) + pad * 2);
  const h = fontSize + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.fillText(str, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

const Label = memo(function Label({
  text,
  position,
  height = 0.5,
  color = '#e8edf7',
  opacity = 0.92,
  align = 'center',
  flip = false,
  spin = 0,
}) {
  const str = String(text ?? '');
  const { tex, aspect } = useMemo(
    () => makeLabelTexture(str, color, opacity),
    [str, color, opacity],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const w = height * aspect;
  const [x, y, z] = position;
  if (!str) return null;
  return (
    <mesh
      position={[align === 'left' ? x + w / 2 : x, y, z]}
      rotation={[-Math.PI / 2, 0, (flip ? Math.PI : 0) + spin]}
    >
      <planeGeometry args={[w, height]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
});

/* Flat circulation arrow (painted chevron pointing +X). */
function DirectionArrow({ position, size = 0.9, color = '#cfd6e4' }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-size / 2, -size / 2);
    s.lineTo(size / 2, -size / 2);
    s.lineTo(0, size / 2);
    s.closePath();
    return s;
  }, [size]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------ bay ------------------------------- */

const Bay = memo(function Bay({
  slot,
  position,
  rot = 0,
  tag,
  selected,
  current,
  hovered,
  onHover,
  onSelect,
  dark,
}) {
  const group = useRef();
  const glowRef = useRef();

  const slotSize = sizeOf(slot);
  const rawStatus = normalizeStatus(slot.status);
  const isCurrent = Boolean(current);
  const isSelected = Boolean(selected) && !isCurrent;
  const effective = isCurrent
    ? 'ACTIVE'
    : isSelected
      ? 'SELECTED'
      : rawStatus === 'UNKNOWN'
        ? 'OUT_OF_SERVICE'
        : rawStatus;
  const color = STATUS_COLOR[effective] ?? STATUS_COLOR.OUT_OF_SERVICE;
  const clickable = effective === 'AVAILABLE' || isSelected;

  const { width: bayWidth, length: bayLength } = BAY_DIMS[slotSize];

  useFrame(({ clock }, dt) => {
    if (group.current) {
      const target = hovered && clickable ? 1.045 : 1;
      group.current.scale.lerp(new THREE.Vector3(target, 1, target), Math.min(1, dt * 10));
    }
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      glowRef.current.emissiveIntensity =
        isCurrent || isSelected ? 1.7 + Math.sin(t * 4) * 0.45 : 1.15;
    }
  });

  // Strict mapping: bay size decides the vehicle. Never mix types.
  const vehicleKind =
    slotSize === 'SMALL' ? 'TWO_WHEELER' : slotSize === 'LARGE' ? 'HEAVY_VEHICLE' : 'CAR';
  const showVehicle = effective === 'OCCUPIED' || isCurrent;
  const vehicleColor = VEHICLE_PALETTE[Number(slot.id ?? 0) % VEHICLE_PALETTE.length];

  const labelSize = slotSize === 'SMALL' ? 0.3 : slotSize === 'LARGE' ? 0.5 : 0.4;
  const stripT = 0.1;

  return (
    <group position={position} rotation={[0, rot, 0]}>
      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          if (clickable) onSelect?.(slot);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (clickable) {
            document.body.style.cursor = 'pointer';
            onHover?.(slot.id);
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          onHover?.(null);
        }}
      >
        {/* dark pad */}
        <mesh receiveShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[bayWidth, 0.08, bayLength]} />
          <meshStandardMaterial color={dark ? '#1a2238' : '#4a5060'} roughness={0.95} />
        </mesh>
        {/* subtle status tint */}
        <mesh receiveShadow position={[0, 0.085, 0]}>
          <boxGeometry args={[bayWidth - 0.18, 0.02, bayLength - 0.18]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={isCurrent || isSelected ? 0.32 : 0.16}
            emissive={color}
            emissiveIntensity={isCurrent || isSelected ? 0.55 : 0.3}
            roughness={0.9}
          />
        </mesh>
        {/* neon perimeter: left / right / back (static) */}
        {[
          [-bayWidth / 2 + stripT / 2, 0, stripT, bayLength],
          [bayWidth / 2 - stripT / 2, 0, stripT, bayLength],
          [0, -bayLength / 2 + stripT / 2, bayWidth, stripT],
        ].map((s, i) => (
          <mesh key={i} position={[s[0], 0.1, s[1]]}>
            <boxGeometry args={[s[2], 0.03, s[3]]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.9}
              roughness={0.5}
            />
          </mesh>
        ))}
        {/* entrance glow bar (animated for selected / active) */}
        <mesh position={[0, 0.1, bayLength / 2 - stripT / 2]}>
          <boxGeometry args={[bayWidth, 0.035, stripT + 0.04]} />
          <meshStandardMaterial
            ref={glowRef}
            color={color}
            emissive={color}
            emissiveIntensity={1.15}
            roughness={0.5}
          />
        </mesh>
        {/* wheel stop (cars and trucks only) */}
        {slotSize !== 'SMALL' && (
          <mesh castShadow position={[0, 0.18, -bayLength / 2 + 0.55]}>
            <boxGeometry args={[Math.min(bayWidth * 0.62, 2.2), 0.2, 0.22]} />
            <meshStandardMaterial color={dark ? '#2c3a5c' : '#b9c1d4'} roughness={0.8} />
          </mesh>
        )}
        {/* painted bay tag inside the driving lane, clear of the dashes */}
        <Label
          text={tag}
          position={[0, 0.04, bayLength / 2 + 1.6]}
          height={labelSize * 1.8}
          color={dark ? '#e8edf7' : '#2b3245'}
          flip={rot !== 0}
        />
        {/* vehicle, centred inside its own bay */}
        {showVehicle && (
          <group position={[0, 0.09, 0]}>
            {vehicleKind === 'TWO_WHEELER' ? (
              <Motorcycle color={vehicleColor} dark={dark} />
            ) : vehicleKind === 'HEAVY_VEHICLE' ? (
              <HeavyVehicle color={vehicleColor} dark={dark} />
            ) : (
              <Car color={vehicleColor} dark={dark} />
            )}
          </group>
        )}
      </group>
    </group>
  );
});

/* Layout math lives in utils/parkingLayout.js (pure + unit-tested). */

/* ------------------------- small scenery -------------------------- */

function Lamp({ position, dark }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.09, 0.12, 4.4, 10]} />
        <meshStandardMaterial color={dark ? '#2b3550' : '#4a5266'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[0.65, 0.2, 0.65]} />
        <meshStandardMaterial
          color="#fff3cf"
          emissive="#ffe9a8"
          emissiveIntensity={dark ? 2.0 : 0.8}
        />
      </mesh>
      <pointLight
        position={[0, 4.2, 0]}
        intensity={dark ? 18 : 5}
        distance={15}
        color="#ffe9b8"
      />
    </group>
  );
}

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

function Gate({ position, dark, accent = '#38bdf8' }) {
  return (
    <group position={position}>
      {[-2.8, 2.8].map((x) => (
        <mesh key={x} castShadow position={[x, 1.1, 0]}>
          <boxGeometry args={[0.5, 2.2, 0.5]} />
          <meshStandardMaterial color={dark ? '#232c47' : '#565d72'} roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.35, 0]}>
        <boxGeometry args={[6.1, 0.28, 0.3]} />
        <meshStandardMaterial color={dark ? '#232c47' : '#565d72'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.35, 0.17]}>
        <boxGeometry args={[5.6, 0.1, 0.02]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={dark ? 1.4 : 0.6}
        />
      </mesh>
    </group>
  );
}

/* --------------------------- scene root --------------------------- */

function LotScene({ slots, selectedId, activeSlotId, onSelect, level }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [hoverId, setHoverId] = useState(null);

  const layout = useMemo(() => computeLayout(slots), [slots]);
  const { placements, lanes, arrows, zones, width, depth, entryLaneZ, frontZ } = layout;
  const groundW = width + 14;
  const groundL = depth + 12;
  const bg = dark ? '#0e1320' : '#eceae2';
  const paint = dark ? '#8a93ad' : '#f4f1e6';

  const laneDash = (lane, li) => {
    // Dashes occupy the centre 60% of the lane only, so they never run
    // under the zone tags (left) or the bay numbers (entrance line).
    const span = Math.max(3, lane.width * 0.6);
    const count = Math.max(1, Math.floor(span / 3));
    const rowW = count * 3 - 1.2;
    return Array.from({ length: count }).map((_, i) => (
      <mesh key={`${li}-${i}`} position={[-rowW / 2 + 0.9 + i * 3, 0.03, lane.z]}>
        <boxGeometry args={[1.8, 0.02, 0.16]} />
        <meshStandardMaterial color={paint} roughness={0.7} />
      </mesh>
    ));
  };

  const walkX = width / 2 + 2.4;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, Math.max(40, depth * 1.5), Math.max(70, depth * 2.4)]} />
      <hemisphereLight
        args={[dark ? '#8aa0d8' : '#fff8e8', dark ? '#11182b' : '#8f8a7c', dark ? 0.55 : 0.8]}
      />
      <ambientLight intensity={dark ? 0.15 : 0.25} />
      <directionalLight
        castShadow
        position={[14, 20, 10]}
        intensity={dark ? 1.0 : 1.6}
        color={dark ? '#cdd9ff' : '#fff2dc'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-(width / 2 + 8)}
        shadow-camera-right={width / 2 + 8}
        shadow-camera-top={depth / 2 + 8}
        shadow-camera-bottom={-(depth / 2 + 8)}
      />

      {/* asphalt */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[groundW, groundL]} />
        <meshStandardMaterial color={dark ? '#161d31' : '#3f4552'} roughness={0.95} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[groundW + 40, groundL + 40]} />
        <meshStandardMaterial color={dark ? '#0b1120' : '#d9d5c8'} roughness={1} />
      </mesh>

      {/* driving-lane dashes + circulation arrows */}
      {lanes.map((lane, li) => laneDash(lane, li))}
      {arrows.map((a, i) => (
        <DirectionArrow key={i} position={[a.x, 0.03, a.z]} color={paint} />
      ))}

      {/* painted zone tags on the lane, left of the dashes */}
      {zones.map(
        (z) =>
          z.laneZ !== null && (
            <Label
              key={z.key}
              text={z.label}
              position={[-width / 2 - 3.4, 0.045, z.laneZ]}
              height={1.05}
              color={dark ? '#7f8db0' : '#5b6378'}
              opacity={0.6}
              align="left"
            />
          ),
      )}

      {/* pedestrian walkway along the east edge */}
      <mesh receiveShadow position={[walkX, 0.02, 0]}>
        <boxGeometry args={[1.8, 0.04, depth]} />
        <meshStandardMaterial color={dark ? '#202a4a' : '#59607a'} roughness={0.95} />
      </mesh>
      <Label
        text="WALKWAY"
        position={[walkX, 0.05, 0]}
        height={0.8}
        color={dark ? '#7f8db0' : '#e8ecf5'}
        opacity={0.65}
        spin={Math.PI / 2}
      />

      {/* bays */}
      {placements.map((p) => (
        <Bay
          key={p.slot.id}
          slot={p.slot}
          position={[p.x, 0, p.z]}
          rot={p.rot}
          tag={levelTag(p.slot.slotNumber, levelCodeOf(p.slot) ?? level)}
          selected={p.slot.id === selectedId}
          current={p.slot.id === activeSlotId}
          hovered={hoverId === p.slot.id}
          onHover={setHoverId}
          onSelect={onSelect}
          dark={dark}
        />
      ))}

      {/* entry + exit gates with painted labels on the entry lane */}
      <Gate position={[-5, 0, frontZ + 1.8]} dark={dark} accent="#22c55e" />
      <Gate position={[5, 0, frontZ + 1.8]} dark={dark} accent="#f59e0b" />
      <Label
        text="ENTRY"
        position={[-5, 0.04, entryLaneZ]}
        height={1.15}
        color={dark ? '#7ee2a8' : '#1d6a44'}
        opacity={0.85}
      />
      <Label
        text="EXIT"
        position={[5, 0.04, entryLaneZ]}
        height={1.15}
        color={dark ? '#f7c491' : '#8a4d16'}
        opacity={0.85}
      />
      <Label
        text={level}
        position={[0, 0.04, entryLaneZ]}
        height={2.4}
        color={dark ? '#5f6f9c' : '#6b728c'}
        opacity={0.55}
      />

      {/* small facility block, back-right outside the bay area */}
      <group position={[width / 2 + 5.4, 0, -depth / 2 + 2.5]}>
        <mesh castShadow position={[0, 1.3, 0]}>
          <boxGeometry args={[5.5, 2.6, 3.5]} />
          <meshStandardMaterial color={dark ? '#1c2440' : '#59607a'} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.7, 1.78]}>
          <boxGeometry args={[4.6, 0.5, 0.06]} />
          <meshStandardMaterial
            color="#bfd4ff"
            emissive="#9db8ff"
            emissiveIntensity={dark ? 0.9 : 0.35}
          />
        </mesh>
      </group>

      <Lamp position={[-width / 2 - 3.2, 0, -depth / 4]} dark={dark} />
      <Lamp position={[width / 2 + 4.2, 0, -depth / 4]} dark={dark} />
      <Lamp position={[-width / 2 - 3.2, 0, depth / 4]} dark={dark} />
      <Lamp position={[width / 2 + 4.2, 0, depth / 4]} dark={dark} />
      <Tree position={[-width / 2 - 4.6, 0, -depth / 2 - 1.5]} dark={dark} />
      <Tree position={[width / 2 + 7.6, 0, depth / 2 + 1.5]} dark={dark} />
      <Tree position={[-width / 2 - 4.6, 0, depth / 2 + 1.5]} dark={dark} />

      <ContactShadows
        position={[0, 0.01, 0]}
        scale={Math.max(30, width + depth)}
        blur={2.2}
        far={6}
        opacity={dark ? 0.65 : 0.42}
        color="#000"
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={8}
        maxDistance={Math.max(50, Math.max(width, depth) * 2.2)}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.15}
        target={[0, 0, 0]}
      />
    </>
  );
}

/* ------------------------- public component ------------------------ */
/* Props: slots (this level's bays), selectedId, activeSlotId,         */
/* onSelect, height, level ('P1' | 'P2' | 'P3'). `level` is optional   */
/* so existing callers keep working.                                   */

export default function ParkingScene({
  slots,
  selectedId,
  activeSlotId,
  onSelect,
  height,
  level = 'P1',
}) {
  const layout = useMemo(() => computeLayout(slots), [slots]);
  if (!slots || slots.length === 0) return null;

  const maxDim = Math.max(layout.width, layout.depth, 10);
  const dist = maxDim * 1.02 + 7;

  return (
    <div className="scene-canvas" style={height ? { height } : undefined}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [dist * 0.58, dist * 0.72, dist * 0.8], fov: 40 }}
        gl={{ antialias: true }}
      >
        <LotScene
          slots={slots}
          selectedId={selectedId}
          activeSlotId={activeSlotId}
          onSelect={onSelect}
          level={level}
        />
      </Canvas>
    </div>
  );
}

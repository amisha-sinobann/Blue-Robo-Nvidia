import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';

export function Environment() {
  const { setObstacles, showHeatmap } = useStore();

  const obstacles = useMemo(() => {
    const obs = [];
    for (let i = 0; i < 20; i++) {
      obs.push(new THREE.Vector3(
        (Math.random() - 0.5) * 40, // Constrained to -20 to 20
        2,
        (Math.random() - 0.5) * 40
      ));
    }
    return obs;
  }, []);

  useEffect(() => {
    setObstacles(obstacles);
  }, [obstacles, setObstacles]);

  const Wall = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[50, 4]} />
      <meshStandardMaterial color="#00ffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(50, 4)]} />
        <lineBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </lineSegments>
    </mesh>
  );

  return (
    <group>
      <gridHelper args={[50, 50, 0x00ffff, 0x111133]} position={[0, 0.01, 0]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color={showHeatmap ? "#220044" : "#050510"} 
          roughness={0.1} 
          metalness={0.8} 
        />
      </mesh>

      {/* Arena Walls */}
      <Wall position={[0, 2, -25]} rotation={[0, 0, 0]} />
      <Wall position={[0, 2, 25]} rotation={[0, Math.PI, 0]} />
      <Wall position={[-25, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Wall position={[25, 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {obstacles.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[2, 4, 2]} />
          <meshPhongMaterial color="#222244" transparent opacity={0.8} />
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2, 4, 2)]} />
            <lineBasicMaterial color="#00ffff" transparent opacity={0.3} />
          </lineSegments>
        </mesh>
      ))}
    </group>
  );
}

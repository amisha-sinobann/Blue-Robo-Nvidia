import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

export function Target() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const lineRef = useRef<any>(null);
  
  const { 
    setLoss, loss, incrementSteps, obstacles,
    difficulty, setDifficulty, incrementCatchCount, targetVulnerable, setTargetVulnerable
  } = useStore();
  
  const [velocity] = useState(() => new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
  const timeSinceLastCatch = useRef(0);
  const lastDifficultyUpdate = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const robotPos = useStore.getState().robotPosition;
    timeSinceLastCatch.current += delta;

    // Dynamic difficulty adjustment during chase
    if (timeSinceLastCatch.current > 10 && difficulty > 1) {
      if (!targetVulnerable) setTargetVulnerable(true);
      
      // Throttle state updates to twice per second
      if (state.clock.elapsedTime - lastDifficultyUpdate.current > 0.5) {
        setDifficulty(Math.max(1, difficulty - 0.25));
        lastDifficultyUpdate.current = state.clock.elapsedTime;
      }
    } else if (timeSinceLastCatch.current <= 10 && targetVulnerable) {
      setTargetVulnerable(false);
    }

    const target = meshRef.current;
    const distToRobot = target.position.distanceTo(robotPos);
    
    if (distToRobot < 1.5) {
      // Caught
      if (timeSinceLastCatch.current < 4) {
        setDifficulty(Math.min(10, difficulty + 1));
      } else if (timeSinceLastCatch.current > 8) {
        setDifficulty(Math.max(1, difficulty - 0.5));
      }
      
      timeSinceLastCatch.current = 0;
      setTargetVulnerable(false);
      incrementCatchCount();

      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      target.position.set(x, 1, z);
      useStore.getState().targetPosition.copy(target.position);
      setLoss(Math.max(0.001, loss * 0.8));
      incrementSteps();
    } else {
      const fleeDir = new THREE.Vector3().subVectors(target.position, robotPos).normalize();
      const wander = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
      
      const avoidance = new THREE.Vector3();
      obstacles.forEach(obs => {
        const distToObs = target.position.distanceTo(obs);
        if (distToObs < 6) {
          const pushDir = new THREE.Vector3().subVectors(target.position, obs);
          pushDir.y = 0;
          pushDir.normalize();
          avoidance.add(pushDir.multiplyScalar(20 / distToObs));
        }
      });

      const BOUND = 24;
      const boundsForce = new THREE.Vector3();
      const margin = 5;
      if (target.position.x > BOUND - margin) boundsForce.x = -(target.position.x - (BOUND - margin));
      if (target.position.x < -BOUND + margin) boundsForce.x = -(target.position.x - (-BOUND + margin));
      if (target.position.z > BOUND - margin) boundsForce.z = -(target.position.z - (BOUND - margin));
      if (target.position.z < -BOUND + margin) boundsForce.z = -(target.position.z - (-BOUND + margin));

      // Apply difficulty to speed and evasiveness
      const speedMultiplier = 0.5 + (difficulty / 10); // Lvl 1 = 0.6, Lvl 10 = 1.5
      const maxSpeed = 15 * speedMultiplier;
      const fleeStrength = 15 * speedMultiplier;

      const acceleration = new THREE.Vector3()
        .add(fleeDir.multiplyScalar(fleeStrength))
        .add(wander.multiplyScalar(5))
        .add(avoidance.multiplyScalar(10))
        .add(boundsForce.multiplyScalar(20));

      velocity.add(acceleration.multiplyScalar(delta));
      velocity.clampLength(0, maxSpeed);

      target.position.add(velocity.clone().multiplyScalar(delta));
      target.position.y = 1 + Math.sin(state.clock.getElapsedTime() * 5) * 0.5;

      // HARD COLLISION WITH OBSTACLES
      obstacles.forEach(obs => {
        const dx = target.position.x - obs.x;
        const dz = target.position.z - obs.z;
        const distSq = dx * dx + dz * dz;
        const minDist = 1.8; // Target radius (0.5) + Obstacle approx radius (1.3)
        if (distSq < minDist * minDist && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          target.position.x += (dx / dist) * overlap;
          target.position.z += (dz / dist) * overlap;
          // Bounce velocity
          velocity.x += (dx / dist) * 5;
          velocity.z += (dz / dist) * 5;
        }
      });

      // HARD BOUNDARIES
      if (target.position.x > BOUND) { target.position.x = BOUND; velocity.x *= -1; }
      if (target.position.x < -BOUND) { target.position.x = -BOUND; velocity.x *= -1; }
      if (target.position.z > BOUND) { target.position.z = BOUND; velocity.z *= -1; }
      if (target.position.z < -BOUND) { target.position.z = -BOUND; velocity.z *= -1; }
      
      useStore.getState().targetPosition.copy(target.position);
    }

    target.rotation.y += delta * 2;
    target.rotation.z += delta;

    // Visual feedback updates
    if (materialRef.current && lightRef.current) {
      if (targetVulnerable) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.5;
        materialRef.current.emissiveIntensity = pulse * 2;
        materialRef.current.color.setHex(0xffff00);
        materialRef.current.emissive.setHex(0xffff00);
        lightRef.current.color.setHex(0xffff00);
        lightRef.current.intensity = pulse * 2;
      } else {
        materialRef.current.emissiveIntensity = 2;
        materialRef.current.color.setHex(0xff0055);
        materialRef.current.emissive.setHex(0xff0055);
        lightRef.current.color.setHex(0xff0055);
        lightRef.current.intensity = 2;
      }
    }

    // Update line geometry directly to avoid React re-renders
    if (targetVulnerable && lineRef.current) {
      const positions = new Float32Array([
        robotPos.x, robotPos.y, robotPos.z,
        target.position.x, target.position.y, target.position.z
      ]);
      lineRef.current.geometry.setPositions(positions);
    }
  });

  return (
    <>
      <Trail
        width={2}
        length={20}
        color={new THREE.Color(targetVulnerable ? '#ffff00' : '#ff0055')}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} position={[5, 1, 5]}>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial ref={materialRef} color="#ff0055" emissive="#ff0055" emissiveIntensity={2} wireframe />
          <pointLight ref={lightRef} color="#ff0055" intensity={2} distance={10} />
        </mesh>
      </Trail>
      {targetVulnerable && (
        <Line
          ref={lineRef}
          points={[[0,0,0], [0,0,0]]}
          color="yellow"
          lineWidth={2}
          dashed={true}
          dashScale={50}
          dashSize={1}
          dashOffset={0}
        />
      )}
    </>
  );
}

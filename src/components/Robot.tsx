import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

export function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  
  const { 
    controlMode, isPaused, isDancing, obstacles
  } = useStore();

  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
  const lastUiUpdate = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setKeys(k => ({ ...k, w: true }));
      if (key === 's' || key === 'arrowdown') setKeys(k => ({ ...k, s: true }));
      if (key === 'a' || key === 'arrowleft') setKeys(k => ({ ...k, a: true }));
      if (key === 'd' || key === 'arrowright') setKeys(k => ({ ...k, d: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setKeys(k => ({ ...k, w: false }));
      if (key === 's' || key === 'arrowdown') setKeys(k => ({ ...k, s: false }));
      if (key === 'a' || key === 'arrowleft') setKeys(k => ({ ...k, a: false }));
      if (key === 'd' || key === 'arrowright') setKeys(k => ({ ...k, d: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return;

    const robot = groupRef.current;
    const t = state.clock.getElapsedTime();
    const targetPos = useStore.getState().targetPosition;

    if (isDancing) {
      robot.position.y = Math.abs(Math.sin(t * 10)) * 0.5;
      robot.rotation.y = Math.sin(t * 5) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 8);
      if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.sin(t * 8);
      return;
    }

    if (bodyRef.current) {
      bodyRef.current.position.y = 1.5 + Math.sin(t * 2) * 0.05;
    }

    if (controlMode === 'MANUAL') {
      const moveSpeed = 15 * delta;
      const turnSpeed = 3 * delta;

      if (keys.w) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(robot.quaternion);
        robot.position.add(forward.multiplyScalar(moveSpeed));
        if (wheelRef.current) wheelRef.current.rotation.x -= moveSpeed;
      }
      if (keys.s) {
        const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(robot.quaternion);
        robot.position.add(backward.multiplyScalar(-moveSpeed));
        if (wheelRef.current) wheelRef.current.rotation.x += moveSpeed;
      }
      if (keys.a) robot.rotation.y += turnSpeed;
      if (keys.d) robot.rotation.y -= turnSpeed;
    } else {
      // AI / RL Navigation Logic
      const maxSpeed = 20 * delta; // Very fast
      const direction = new THREE.Vector3().subVectors(targetPos, robot.position);
      const distance = direction.length();
      
      const avoidanceForce = new THREE.Vector3();
      obstacles.forEach(obs => {
        const distToObs = robot.position.distanceTo(obs);
        if (distToObs < 6) {
          const pushDir = new THREE.Vector3().subVectors(robot.position, obs);
          pushDir.y = 0;
          pushDir.normalize();
          avoidanceForce.add(pushDir.multiplyScalar(30 / (distToObs * distToObs)));
        }
      });

      const desiredVelocity = direction.normalize().multiplyScalar(maxSpeed);
      desiredVelocity.add(avoidanceForce.multiplyScalar(10 * delta));

      const lookTarget = new THREE.Vector3().copy(targetPos);
      lookTarget.y = robot.position.y;
      
      // Smooth rotation towards target
      const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(robot.position, lookTarget, new THREE.Vector3(0, 1, 0))
      );
      robot.quaternion.slerp(targetQuaternion, 10 * delta);

      if (distance > 1.5) {
        robot.position.add(desiredVelocity);
        if (wheelRef.current) wheelRef.current.rotation.x -= desiredVelocity.length();
      }
    }

    // HARD COLLISION WITH OBSTACLES
    obstacles.forEach(obs => {
      const dx = robot.position.x - obs.x;
      const dz = robot.position.z - obs.z;
      const distSq = dx * dx + dz * dz;
      const minDist = 2.2; // Robot radius (1) + Obstacle approx radius (1.2)
      if (distSq < minDist * minDist && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        robot.position.x += (dx / dist) * overlap;
        robot.position.z += (dz / dist) * overlap;
      }
    });

    // HARD BOUNDARIES
    const BOUND = 24;
    if (robot.position.x > BOUND) robot.position.x = BOUND;
    if (robot.position.x < -BOUND) robot.position.x = -BOUND;
    if (robot.position.z > BOUND) robot.position.z = BOUND;
    if (robot.position.z < -BOUND) robot.position.z = -BOUND;

    useStore.getState().robotPosition.copy(robot.position);

    // Throttle UI updates to ~10fps to prevent lag
    if (t - lastUiUpdate.current > 0.1) {
      const robotDir = new THREE.Vector3(0, 0, 1).applyQuaternion(robot.quaternion);
      const targetDir = new THREE.Vector3().subVectors(targetPos, robot.position).normalize();
      const angle = robotDir.angleTo(targetDir);
      const inView = angle < 1.0; 
      
      useStore.getState().setTargetInView(inView);
      useStore.getState().setCvConfidence(inView ? Math.max(0, 1 - angle) : 0);
      useStore.getState().setDistance(robot.position.distanceTo(targetPos));
      lastUiUpdate.current = t;
    }
  });

  return (
    <group ref={groupRef}>
      <Trail
        width={1}
        length={30}
        color={new THREE.Color('#00ffff')}
        attenuation={(t) => t * t}
      >
        <mesh ref={bodyRef} position={[0, 1.5, 0]} castShadow>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#0088ff" roughness={0.3} metalness={0.4} />
          
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
            
            <mesh position={[-0.25, 0.1, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
            <mesh position={[0.25, 0.1, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          </mesh>

          <mesh ref={leftArmRef} position={[-1.2, 0, 0]} rotation={[0, 0, -0.2]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.8]} />
            <meshStandardMaterial color="#0088ff" />
          </mesh>
          <mesh ref={rightArmRef} position={[1.2, 0, 0]} rotation={[0, 0, 0.2]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.8]} />
            <meshStandardMaterial color="#0088ff" />
          </mesh>

          <mesh ref={wheelRef} position={[0, -0.9, 0]} castShadow>
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
        </mesh>
      </Trail>
    </group>
  );
}

import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Robot } from './Robot';
import { Target } from './Target';
import { Environment } from './Environment';
import { useStore } from '../store';
import * as THREE from 'three';

function CameraController() {
  useFrame((state) => {
    const robotPos = useStore.getState().robotPosition;
    const targetCamPos = robotPos.clone().add(new THREE.Vector3(0, 10, 15));
    state.camera.position.lerp(targetCamPos, 0.05);
    state.camera.lookAt(robotPos);
  });

  return null;
}

export function Scene() {
  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }}>
      <color attach="background" args={['#050510']} />
      <fogExp2 attach="fog" args={['#050510', 0.02]} />
      
      <ambientLight intensity={1.5} color="#404080" />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={2} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight 
        position={[-10, 20, -5]} 
        intensity={4} 
        color="#00ffff" 
        penumbra={0.5} 
        castShadow
      />

      <Environment />
      <Robot />
      <Target />
      
      <CameraController />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={1.5} />
        <ChromaticAberration 
          blendFunction={BlendFunction.NORMAL} 
          offset={new THREE.Vector2(0.002, 0.002)} 
        />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
}

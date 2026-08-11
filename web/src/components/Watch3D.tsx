import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface WatchProps {
  elapsedSeconds: number
  subject: string
  topic: string
  pendingQuestionText: string | null
  lastAnswerCorrect: boolean | null
  vibrateSignal: number
}

function WatchModel({ elapsedSeconds, subject, topic, pendingQuestionText, lastAnswerCorrect, vibrateSignal }: WatchProps) {
  const groupRef = useRef<THREE.Group>(null)
  const shakeUntilRef = useRef(0)

  useEffect(() => {
    if (vibrateSignal > 0) shakeUntilRef.current = performance.now() + 900
  }, [vibrateSignal])

  useFrame(() => {
    if (!groupRef.current) return
    const now = performance.now()
    if (now < shakeUntilRef.current) {
      groupRef.current.position.x = Math.sin(now * 0.09) * 0.06
      groupRef.current.rotation.z = Math.sin(now * 0.09) * 0.035
    } else {
      groupRef.current.position.x = 0
      groupRef.current.rotation.z = 0
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* top band */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <boxGeometry args={[0.58, 1.35, 0.2]} />
        <meshStandardMaterial color="#26262b" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* bottom band */}
      <mesh position={[0, -1.62, 0]} castShadow>
        <boxGeometry args={[0.58, 1.35, 0.2]} />
        <meshStandardMaterial color="#26262b" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* case */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.12, 1.12, 0.36, 64]} />
        <meshStandardMaterial color="#d9dce1" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* crown */}
      <mesh position={[1.16, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.17, 24]} />
        <meshStandardMaterial color="#bcc0c8" roughness={0.25} metalness={0.95} />
      </mesh>

      {/* bezel */}
      <mesh position={[0, 0, 0.185]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 0.045, 64]} />
        <meshStandardMaterial color="#111114" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* screen glow ring */}
      <mesh position={[0, 0, 0.208]}>
        <ringGeometry args={[0.89, 0.93, 64]} />
        <meshBasicMaterial color={pendingQuestionText ? '#818cf8' : '#3730a3'} transparent opacity={pendingQuestionText ? 0.9 : 0.4} />
      </mesh>

      {/* screen */}
      <mesh position={[0, 0, 0.21]}>
        <circleGeometry args={[0.89, 64]} />
        <meshStandardMaterial color="#05050a" roughness={0.5} metalness={0.15} />
      </mesh>

      <Html transform occlude={false} position={[0, 0, 0.215]} scale={0.192} className="pointer-events-none select-none">
        <div
          style={{
            width: 155,
            height: 155,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#e5e7ff',
            fontFamily: 'system-ui, sans-serif',
            padding: 14,
            boxSizing: 'border-box',
            background: pendingQuestionText
              ? 'radial-gradient(circle, rgba(99,102,241,0.35), rgba(5,5,10,0) 70%)'
              : 'transparent',
          }}
        >
          {pendingQuestionText ? (
            <>
              <p style={{ fontSize: 10, letterSpacing: 1, color: '#a5b4fc', margin: 0, textTransform: 'uppercase' }}>
                Loco asks
              </p>
              <p style={{ fontSize: 12, lineHeight: 1.3, margin: '5px 0 0' }}>
                {pendingQuestionText.length > 70 ? `${pendingQuestionText.slice(0, 70)}...` : pendingQuestionText}
              </p>
            </>
          ) : lastAnswerCorrect !== null ? (
            <>
              <p style={{ fontSize: 32, margin: 0 }}>{lastAnswerCorrect ? '✓' : '✗'}</p>
              <p style={{ fontSize: 11, margin: '3px 0 0', color: lastAnswerCorrect ? '#6ee7b7' : '#fca5a5' }}>
                {lastAnswerCorrect ? 'Nice work' : 'Keep going'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 25, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {formatDuration(elapsedSeconds)}
              </p>
              <p style={{ fontSize: 11, margin: '5px 0 0', color: '#9ca3af' }}>{subject}</p>
              <p style={{ fontSize: 10, margin: '1px 0 0', color: '#6b7280' }}>{topic}</p>
            </>
          )}
        </div>
      </Html>
    </group>
  )
}

export function Watch3D(props: WatchProps) {
  return (
    <div className="w-full h-full min-h-[420px]">
      <Canvas camera={{ position: [0, 0, 5.4], fov: 35 }} dpr={[1, 2]} shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 3, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-3, -2, 2]} intensity={0.3} />
          <WatchModel {...props} />
          <ContactShadows position={[0, -2.6, 0]} opacity={0.45} scale={6} blur={2.4} far={3} />
          <Environment resolution={256}>
            <Lightformer intensity={2} color="white" position={[0, 4, 2]} scale={[8, 1, 1]} />
            <Lightformer intensity={1.2} color="#818cf8" position={[-4, 1, 3]} scale={[5, 1, 1]} rotation={[0, Math.PI / 2, 0]} />
            <Lightformer intensity={1.2} color="#e879f9" position={[4, 1, -3]} scale={[5, 1, 1]} rotation={[0, -Math.PI / 2, 0]} />
          </Environment>
          <OrbitControls enableZoom={true} minDistance={3.5} maxDistance={7} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  )
}

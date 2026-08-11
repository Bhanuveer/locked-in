import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
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

  useFrame((state) => {
    if (!groupRef.current) return
    const now = performance.now()
    if (now < shakeUntilRef.current) {
      groupRef.current.position.x = Math.sin(now * 0.09) * 0.05
      groupRef.current.rotation.z = Math.sin(now * 0.09) * 0.03
    } else {
      groupRef.current.position.x = 0
      groupRef.current.rotation.z = 0
    }
    void state
  })

  return (
    <group ref={groupRef}>
      {/* top band */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.55, 1.3, 0.18]} />
        <meshStandardMaterial color="#26262b" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* bottom band */}
      <mesh position={[0, -1.55, 0]}>
        <boxGeometry args={[0.55, 1.3, 0.18]} />
        <meshStandardMaterial color="#26262b" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* case */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.08, 1.08, 0.34, 64]} />
        <meshStandardMaterial color="#d4d7dc" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* crown */}
      <mesh position={[1.12, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 24]} />
        <meshStandardMaterial color="#b8bcc4" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* bezel */}
      <mesh position={[0, 0, 0.175]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.04, 64]} />
        <meshStandardMaterial color="#111114" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* screen */}
      <mesh position={[0, 0, 0.2]}>
        <circleGeometry args={[0.88, 64]} />
        <meshStandardMaterial color="#05050a" roughness={0.6} metalness={0.1} />
      </mesh>

      <Html transform occlude={false} position={[0, 0, 0.205]} scale={0.145} className="pointer-events-none select-none">
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
              <p style={{ fontSize: 8, letterSpacing: 1, color: '#a5b4fc', margin: 0, textTransform: 'uppercase' }}>
                Loco asks
              </p>
              <p style={{ fontSize: 10, lineHeight: 1.25, margin: '4px 0 0' }}>
                {pendingQuestionText.length > 70 ? `${pendingQuestionText.slice(0, 70)}...` : pendingQuestionText}
              </p>
            </>
          ) : lastAnswerCorrect !== null ? (
            <>
              <p style={{ fontSize: 26, margin: 0 }}>{lastAnswerCorrect ? '✓' : '✗'}</p>
              <p style={{ fontSize: 9, margin: '2px 0 0', color: lastAnswerCorrect ? '#6ee7b7' : '#fca5a5' }}>
                {lastAnswerCorrect ? 'Nice work' : 'Keep going'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 20, fontWeight: 600, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {formatDuration(elapsedSeconds)}
              </p>
              <p style={{ fontSize: 9, margin: '4px 0 0', color: '#9ca3af' }}>{subject}</p>
              <p style={{ fontSize: 8, margin: '1px 0 0', color: '#6b7280' }}>{topic}</p>
            </>
          )}
        </div>
      </Html>
    </group>
  )
}

export function Watch3D(props: WatchProps) {
  return (
    <div className="w-full h-full min-h-[280px]">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 35 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 3, 5]} intensity={1.1} />
          <directionalLight position={[-3, -2, 2]} intensity={0.35} />
          <WatchModel {...props} />
          <OrbitControls autoRotate autoRotateSpeed={0.6} enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  )
}

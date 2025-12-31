import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Fish {
    id: number
    type: string
    emoji: string
    rarity: string
    caughtAt: number
    sessionDuration: number
    // Animation state
    x: number
    y: number
    speedX: number
    speedY: number
}

const rarityColors: Record<string, string> = {
    '普通': 'text-gray-400',
    '稀有': 'text-blue-400',
    '史诗': 'text-purple-400',
    '传说': 'text-yellow-400',
}

const FishPond: React.FC = () => {
    const { t } = useTranslation()
    const [fish, setFish] = useState<Fish[]>([])
    const [totalLoafingSeconds, setTotalLoafingSeconds] = useState(0)
    const pondRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const loadData = async () => {
            const total = await window.electron.ipcRenderer.invoke('get-settings', 'totalLoafingSeconds')
            const storedFish = await window.electron.ipcRenderer.invoke('get-settings', 'fish') || []

            setTotalLoafingSeconds(total || 0)

            // Initialize fish with random positions and speeds
            const animatedFish = storedFish.map((f: any) => ({
                ...f,
                x: Math.random() * 80 + 10,
                y: Math.random() * 60 + 20,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 1,
            }))
            setFish(animatedFish)
        }
        loadData()
    }, [])

    // Animate fish
    useEffect(() => {
        const interval = setInterval(() => {
            setFish(prev => prev.map(f => {
                let newX = f.x + f.speedX * 0.5
                let newY = f.y + f.speedY * 0.3
                let newSpeedX = f.speedX
                let newSpeedY = f.speedY

                // Bounce off walls
                if (newX < 5 || newX > 95) {
                    newSpeedX *= -1
                    newX = Math.max(5, Math.min(95, newX))
                }
                if (newY < 10 || newY > 80) {
                    newSpeedY *= -1
                    newY = Math.max(10, Math.min(80, newY))
                }

                // Random direction change
                if (Math.random() < 0.02) {
                    newSpeedX += (Math.random() - 0.5) * 0.5
                    newSpeedY += (Math.random() - 0.5) * 0.3
                }

                return { ...f, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY }
            }))
        }, 100)

        return () => clearInterval(interval)
    }, [])

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return h > 0 ? `${h}${t('fishPond.hours')} ${m}${t('fishPond.minutes')}` : `${m}${t('fishPond.minutes')}`
    }

    // Count fish by rarity
    const fishCounts = {
        '普通': fish.filter(f => f.rarity === '普通').length,
        '稀有': fish.filter(f => f.rarity === '稀有').length,
        '史诗': fish.filter(f => f.rarity === '史诗').length,
        '传说': fish.filter(f => f.rarity === '传说').length,
    }

    return (
        <div className="text-white h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 filter drop-shadow-sm">
                {t('fishPond.title')}
            </h2>
            <p className="text-cyan-200/60 text-sm mb-6">{t('fishPond.subtitle')}</p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-[#1e293b]/50 backdrop-blur-md p-3 rounded-2xl text-center border border-slate-500/20 shadow-lg relative overflow-hidden group hover:bg-[#1e293b]/70 transition-colors">
                    <div className="text-2xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">🐟</div>
                    <div className="text-xl font-bold text-slate-200">{fishCounts['普通']}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t('rarity.common')}</div>
                </div>
                <div className="bg-[#1e293b]/50 backdrop-blur-md p-3 rounded-2xl text-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden group hover:bg-[#1e293b]/70 transition-colors">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-full blur-xl"></div>
                    <div className="text-2xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">🐠</div>
                    <div className="text-xl font-bold text-blue-400">{fishCounts['稀有']}</div>
                    <div className="text-[10px] text-blue-400/70 uppercase tracking-wider font-bold">{t('rarity.rare')}</div>
                </div>
                <div className="bg-[#1e293b]/50 backdrop-blur-md p-3 rounded-2xl text-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:bg-[#1e293b]/70 transition-colors">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-full blur-xl"></div>
                    <div className="text-2xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">🐡</div>
                    <div className="text-xl font-bold text-purple-400">{fishCounts['史诗']}</div>
                    <div className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">{t('rarity.epic')}</div>
                </div>
                <div className="bg-[#1e293b]/50 backdrop-blur-md p-3 rounded-2xl text-center border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)] relative overflow-hidden group hover:bg-[#1e293b]/70 transition-colors">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500/10 rounded-full blur-xl"></div>
                    <div className="text-2xl mb-1 filter drop-shadow-md group-hover:scale-110 transition-transform">🦈</div>
                    <div className="text-xl font-bold text-yellow-400">{fishCounts['传说']}</div>
                    <div className="text-[10px] text-yellow-500/70 uppercase tracking-wider font-bold">{t('rarity.legendary')}</div>
                </div>
            </div>

            {/* Fish Pond - Animated */}
            <div
                ref={pondRef}
                className="relative flex-1 bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl border border-cyan-500/20 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] group"
                style={{ minHeight: '300px' }}
            >
                {/* Ambient Light/Water Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                {/* Bubbles (simulated efficiently) */}
                <div className="absolute bottom-10 left-10 w-2 h-2 bg-white/10 rounded-full animate-ping duration-[3000ms]"></div>
                <div className="absolute bottom-20 right-20 w-3 h-3 bg-white/5 rounded-full animate-ping duration-[5000ms]"></div>


                {fish.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-500/30 flex-col gap-4">
                        <div className="text-6xl animate-pulse filter blur-sm">🌊</div>
                        <div className="font-mono text-sm tracking-widest uppercase">{t('fishPond.noLife')}</div>
                    </div>
                ) : (
                    fish.map((f) => (
                        <div
                            key={f.id}
                            className={`absolute transition-all duration-[2000ms] ease-linear cursor-grab active:cursor-grabbing hover:scale-125 hover:z-50 ${rarityColors[f.rarity]}`}
                            style={{
                                left: `${f.x}%`,
                                top: `${f.y}%`,
                                transform: `scaleX(${f.speedX > 0 ? -1 : 1})`,
                                fontSize: f.rarity === '传说' ? '3rem' : f.rarity === '史诗' ? '2.5rem' : '1.8rem',
                                filter: `drop-shadow(0 0 ${f.rarity === '传说' ? '15px' : '5px'} currentColor)`
                            }}
                            title={`${f.type} (${f.rarity}) - ${formatTime(f.sessionDuration)}`}
                        >
                            {f.emoji}
                        </div>
                    ))
                )}

                {/* Total counter */}
                <div className="absolute bottom-4 right-4 bg-[#0f172a]/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono border border-cyan-500/20 text-cyan-200/70 shadow-lg">
                    {t('fishPond.total')}: <span className="text-cyan-400 font-bold">{fish.length}</span>
                </div>
            </div>

            <div className="mt-4 text-center text-xs text-slate-500 font-mono">
                {t('fishPond.totalTime')}: <span className="text-cyan-500">{formatTime(totalLoafingSeconds)}</span>
            </div>
        </div>
    )
}

export default FishPond

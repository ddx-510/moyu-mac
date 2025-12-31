import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Fish {
    id: number
    type: string
    emoji: string
    rarity: string
    weight: number
    minMinutes: number
    caughtAt?: number
    sessionDuration?: number
}



const FishingGame: React.FC = () => {
    const { t } = useTranslation()
    const [gameState, setGameState] = useState<'WAITING' | 'CASTING' | 'FIGHTING' | 'RESULT'>('WAITING')
    const [sessionData, setSessionData] = useState<any>(null)
    const [progress, setProgress] = useState(0) // Bar position 0-100

    const [targetZone, setTargetZone] = useState({ start: 40, width: 20 })
    const [result, setResult] = useState<{ success: boolean, fish?: Fish | null, money: number } | null>(null)
    const [currency, setCurrency] = useState('¥')

    // Animation ref
    const requestRef = useRef<number | null>(null)

    useEffect(() => {
        // Get data from main process
        const init = async () => {
            const data = await window.electron.ipcRenderer.invoke('get-fishing-data')
            setSessionData(data)

            const c = await window.electron.ipcRenderer.invoke('get-settings', 'currency')
            if (c) setCurrency(c)

            // Calculate difficulty/target based on duration?
            // For now random target
            const width = Math.max(10, 30 - (data.duration / 600)) // Harder if longer? Or easier?
            // Actually maybe standard difficulty
            setTargetZone({
                start: 20 + Math.random() * 50,
                width: 20
            })
        }
        init()

        // Auto start casting after a moment
        setTimeout(() => setGameState('CASTING'), 1000)
    }, [])

    // Animation direction ref (1 for right, -1 for left)
    const directionRef = useRef(1)

    useEffect(() => {
        if (gameState === 'CASTING') {
            const animate = () => {
                setProgress(p => {
                    let newP = p + directionRef.current * 1.5 // Speed

                    // Bounce logic
                    if (newP >= 100) {
                        newP = 100
                        directionRef.current = -1
                    } else if (newP <= 0) {
                        newP = 0
                        directionRef.current = 1
                    }

                    return newP
                })
                requestRef.current = requestAnimationFrame(animate)
            }
            requestRef.current = requestAnimationFrame(animate)
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [gameState])

    const handleCast = () => {
        if (gameState !== 'CASTING') return

        // Check hit
        const hit = progress >= targetZone.start && progress <= (targetZone.start + targetZone.width)

        if (hit) {
            setGameState('FIGHTING')
            // Simulate short struggle or just immediate win for now
            setTimeout(() => determineCatch(true), 500)
        } else {
            setGameState('RESULT')
            determineCatch(false)
        }
    }

    const determineCatch = (success: boolean) => {
        if (!sessionData) return

        const caughtFish = success ? sessionData.hookedFish : null
        const money = sessionData.earned || 0

        setResult({ success, fish: caughtFish, money })
        setGameState('RESULT')

        // Report back to main
        if (success && caughtFish) {
            window.electron.ipcRenderer.send('fishing-complete', caughtFish)
        }
    }

    const closeGame = () => {
        window.electron.ipcRenderer.send('close-fishing-window')
    }

    if (!sessionData) return <div className="text-white p-4">Loading...</div>

    return (
        <div className="h-screen w-screen bg-gradient-to-b from-[#1e293b] to-[#020617] text-white flex flex-col items-center justify-center select-none overflow-hidden p-6 relative" onClick={handleCast}>

            {/* Ambient Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />

            {/* Header Stats */}
            <div className="absolute top-4 left-0 right-0 flex justify-between px-6 text-sm text-cyan-200/80 z-20">
                <div className="bg-[#0f172a]/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/10 flex items-center gap-2">
                    ⏱️ <span className="font-mono">{sessionData.duration < 60 ? `${Math.floor(sessionData.duration)}s` : `${(sessionData.duration / 60).toFixed(2)}m`}</span>
                </div>
                <div className="bg-[#0f172a]/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/10 flex items-center gap-2">
                    {t('fishing.earned')}: <span className="text-emerald-400 font-mono font-bold">{currency}{sessionData.earned.toFixed(2)}</span>
                </div>
            </div>

            {/* Game Area */}
            {gameState === 'CASTING' && (
                <div className="w-full max-w-md z-10 relative">
                    <div className="text-center mb-12">
                        <div className="text-2xl font-bold text-cyan-50 animate-bounce drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {t('fishing.castLine')}
                        </div>
                        <div className="text-xs text-cyan-400/50 mt-2">Wait for the bar to align</div>
                    </div>

                    {/* Bar */}
                    <div className="h-12 bg-[#020617]/80 rounded-full relative overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/10">
                        {/* Target Zone */}
                        <div
                            className="absolute top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.3)] backdrop-blur-sm transition-all duration-300"
                            style={{ left: `${targetZone.start}%`, width: `${targetZone.width}%` }}
                        >
                            <div className="w-full h-full bg-emerald-400/10 animate-pulse" />
                        </div>

                        {/* Cursor */}
                        <div
                            className="absolute top-0 bottom-0 w-2.5 bg-cyan-100 shadow-[0_0_15px_rgba(34,211,238,1)] rounded-full z-10 transform -translate-x-1/2 transition-shadow duration-75"
                            style={{ left: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {gameState === 'FIGHTING' && (
                <div className="text-5xl animate-pulse text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10 font-bold tracking-wider">
                    {t('fishing.fighting')}
                </div>
            )}

            {gameState === 'RESULT' && result && (
                <div className="relative z-20 text-center animate-in zoom-in duration-300 bg-[#1e293b]/90 p-8 rounded-3xl border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(8,145,178,0.3)] max-w-sm w-full">
                    <div className="absolute top-0 right-0 p-24 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="text-7xl mb-6 filter drop-shadow-lg transform hover:scale-110 transition-transform duration-300 cursor-default">
                        {result.success ? result.fish?.emoji : '💨'}
                    </div>

                    <h2 className="text-2xl font-bold mb-3 text-cyan-50">
                        {result.success ? t('fishing.caught', { fish: result.fish?.type }) : t('fishing.escaped')}
                    </h2>

                    {result.success && (
                        <div className={`text-xs font-bold mb-6 px-4 py-1.5 rounded-full inline-block tracking-wider uppercase border
                            ${result.fish?.rarity === '传说' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                                result.fish?.rarity === '史诗' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]' :
                                    result.fish?.rarity === '稀有' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                                        'bg-slate-500/10 text-slate-300 border-slate-500/30'
                            }`}
                        >
                            {result.fish?.rarity}
                        </div>
                    )}

                    <div className="bg-[#0f172a]/60 rounded-2xl p-5 mb-8 text-left space-y-3 text-sm border border-cyan-500/10">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">{t('fishing.thisSession')}</span>
                            <span className="text-cyan-100 font-mono">{(sessionData.duration / 60).toFixed(2)} min</span>
                        </div>
                        <div className="w-full h-px bg-white/5" />
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">{t('fishing.bossContribution')}</span>
                            <span className="text-emerald-400 font-bold font-mono text-base">+{currency}{result.money.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); closeGame() }}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        {t('fishing.finish')}
                    </button>
                </div>
            )}

            {gameState === 'WAITING' && (
                <div className="text-cyan-500/50 animate-pulse font-mono tracking-widest uppercase text-sm">Waiting for signal...</div>
            )}

        </div>
    )
}

export default FishingGame

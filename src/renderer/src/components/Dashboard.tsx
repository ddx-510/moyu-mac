import React, { useState, useEffect } from 'react'
import { Banknote, Timer, Eye, EyeOff, RefreshCw, Code, Fish, Settings, Power, Maximize2, ChevronLeft, ChevronRight, Waves } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'


// Helper to generate random swim stats
const getSwimStats = (id: number) => {
    // Deterministic pseudo-random based on ID to keep it stable across renders
    const rand = (seed: number) => {
        const x = Math.sin(id + seed) * 10000
        return x - Math.floor(x)
    }
    return {
        top: 10 + rand(1) * 80, // 10% to 90% height
        duration: 10 + rand(2) * 20, // 10-30s duration
        delay: rand(3) * -20, // Negative delay to start mid-swim
        depth: rand(4), // Z-index sorting
        scale: 0.8 + rand(5) * 0.5 // Scale variation
    }
}

const Dashboard: React.FC = () => {
    const { t } = useTranslation()
    const [totalLoafingSeconds, setTotalLoafingSeconds] = useState(0)
    const [moneyEarned, setMoneyEarned] = useState(0)
    const [isLoafing, setIsLoafing] = useState(false)
    const [loafType, setLoafType] = useState<string | null>(null)
    const [loafStart, setLoafStart] = useState<number | null>(null)
    const [loafElapsed, setLoafElapsed] = useState(0)
    const [currentView, setCurrentView] = useState<'dashboard' | 'pond'>('dashboard')
    const [collectedFish, setCollectedFish] = useState<any[]>([])

    // Work timer
    const [workStartTime, setWorkStartTime] = useState(Date.now())
    const [now, setNow] = useState(Date.now())

    const [currency, setCurrency] = useState('¥')
    const [isTracking, setIsTracking] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const history = await window.electron.ipcRenderer.invoke('get-settings', 'breakHistory') || []
            const salary = await window.electron.ipcRenderer.invoke('get-settings', 'salary') || 10000
            const c = await window.electron.ipcRenderer.invoke('get-settings', 'currency')
            const fish = await window.electron.ipcRenderer.invoke('get-settings', 'fish') || []
            setCollectedFish(fish)
            if (c) setCurrency(c)

            const tracking = await window.electron.ipcRenderer.invoke('get-tracking-status')
            setIsTracking(tracking)

            const days = await window.electron.ipcRenderer.invoke('get-settings', 'workDays') || 22
            const hours = await window.electron.ipcRenderer.invoke('get-settings', 'workHours') || 8
            const startTime = await window.electron.ipcRenderer.invoke('get-work-start-time') || Date.now()

            setWorkStartTime(startTime)

            // Calculate today's total
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
            const todaySessions = history.filter((s: any) => s.startTime >= startOfDay)
            const todayTotal = todaySessions.reduce((acc: number, curr: any) => acc + curr.duration, 0)

            setTotalLoafingSeconds(todayTotal)

            const rate = salary / (days * hours * 3600)
            setMoneyEarned(todayTotal * rate)
        }
        loadData()

        const interval = setInterval(() => {
            loadData()
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Loafing timer
    useEffect(() => {
        if (isLoafing && loafStart) {
            const interval = setInterval(() => {
                setLoafElapsed(Math.floor((Date.now() - loafStart) / 1000))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [isLoafing, loafStart])

    // Listen for triggers from Main (e.g. from Prompt window)
    useEffect(() => {
        const handler = (_event: any, type: string) => {
            startLoafing(type)
        }
        window.electron.ipcRenderer.on('trigger-loafing', handler)
        return () => {
            window.electron.ipcRenderer.removeAllListeners('trigger-loafing')
        }
    }, [])


    const WORK_INTERVAL_MINS = 60
    const WORK_INTERVAL_SECONDS = WORK_INTERVAL_MINS * 60
    // Calculate elapsed minutes based on actual start time from main process
    const elapsedSeconds = Math.max(0, (now - workStartTime) / 1000)
    // Cap at 60 mins for display
    const displaySeconds = Math.min(elapsedSeconds, WORK_INTERVAL_SECONDS)
    const progress = (displaySeconds / WORK_INTERVAL_SECONDS) * 100
    const secondsLeft = Math.max(0, WORK_INTERVAL_SECONDS - displaySeconds)

    const minutesLeftDisplay = Math.floor(secondsLeft / 60)
    const secondsLeftDisplay = Math.floor(secondsLeft % 60)
    const displayTime = `${minutesLeftDisplay}:${secondsLeftDisplay.toString().padStart(2, '0')}`

    const formatLoafTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds)
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        if (h > 0) return `${h}h ${m}m`
        if (m > 0) return `${m}m ${s}s`
        return `${s}s`
    }

    const startLoafing = (type: string) => {
        if (type === 'fake-update') {
            window.electron.ipcRenderer.send('start-loafing', 'fake-update')
        } else if (type === 'fake-coding') {
            window.electron.ipcRenderer.send('start-loafing', 'fake-coding')
        } else {
            // Poop - inline timer
            setLoafType(type)
            setLoafStart(Date.now())
            setIsLoafing(true)
            setLoafElapsed(0)
        }
    }

    const stopLoafing = async () => {
        if (!loafStart) return

        const duration = loafElapsed
        const salary = await window.electron.ipcRenderer.invoke('get-settings', 'salary') || 10000
        const days = await window.electron.ipcRenderer.invoke('get-settings', 'workDays') || 22
        const hours = await window.electron.ipcRenderer.invoke('get-settings', 'workHours') || 8
        const rate = salary / (days * hours * 3600)
        // Send duration to main process to handle rewards and fishing
        window.electron.ipcRenderer.send('end-poop-session', duration)

        // Reset state
        setIsLoafing(false)
        setLoafType(null)
        setLoafStart(null)
        setLoafElapsed(0)

        window.electron.ipcRenderer.send('stop-loafing')
    }

    const toggleTracking = async () => {
        const newState = !isTracking
        await window.electron.ipcRenderer.invoke('toggle-tracking', newState)
        setIsTracking(newState)

        new Notification(t('dashboard.trackingNotif'), {
            body: newState ? t('dashboard.trackingOnMsg') : t('dashboard.trackingOffMsg'),
            silent: true
        })
    }

    // Loafing mode UI
    if (isLoafing) {
        return (
            <div className="p-5 w-72 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/50 text-white shadow-2xl">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-bounce flex justify-center">
                        {loafType === 'poop' ? <PoopIcon className="w-12 h-12 text-orange-400" /> : <Fish className="w-12 h-12 text-cyan-400" />}
                    </div>
                    <div className="text-sm text-gray-400 mb-2">{t('dashboard.loafing')}</div>
                    <div className="text-4xl font-mono font-bold text-green-400 mb-6">
                        {formatLoafTime(loafElapsed)}
                    </div>
                    <button
                        onClick={stopLoafing}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all"
                    >
                        {t('dashboard.stopLoafing')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 w-72 h-[330px] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-xl shadow-cyan-900/20 flex flex-col overflow-hidden relative">

            {/* Header: Controls */}
            <div className="relative flex justify-between items-center px-1 mb-2 shrink-0 z-20 h-6">
                {/* Tracking Toggle */}
                <button
                    onClick={toggleTracking}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${isTracking ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-slate-800/50 text-slate-500'}`}
                    title={isTracking ? t('dashboard.trackingOn') : t('dashboard.trackingOff')}
                >
                    {isTracking ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Navigation Group - Absolutely Centered */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`p-0.5 text-slate-500 hover:text-cyan-400 transition-colors ${currentView === 'dashboard' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentView === 'dashboard' ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        />
                        <button
                            onClick={() => setCurrentView('pond')}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${(currentView as string) === 'pond' ? 'bg-cyan-400 scale-125 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                        />
                    </div>

                    <button
                        onClick={() => setCurrentView('pond')}
                        className={`p-0.5 text-slate-500 hover:text-cyan-400 transition-colors ${(currentView as string) === 'pond' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Right Actions: Settings & Quit */}
                <div className="flex gap-1">
                    <button
                        onClick={() => window.electron.ipcRenderer.send('open-settings')}
                        className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-400 hover:text-cyan-200 transition-colors"
                        title={t('nav.settings')}
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.electron.ipcRenderer.send('quit-app')}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title={t('tray.quit')}
                    >
                        <Power className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>



            {/* Main Content Area with Slide Animation */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false} custom={(currentView as string) === 'pond' ? 1 : -1}>
                    {(currentView as string) === 'dashboard' ? (
                        <motion.div
                            key="dashboard"
                            custom={(currentView as string) === 'pond' ? 1 : -1}
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 flex flex-col gap-2 px-1"
                        >
                            {/* Circular Progress (Shifted Up) */}
                            <div className="flex flex-col items-center relative pt-2">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-xl animate-pulse" />
                                    <svg className="w-full h-full transform -rotate-90 relative">
                                        <circle
                                            cx="40" cy="40" r="32"
                                            stroke="currentColor" strokeWidth="5" fill="transparent"
                                            className="text-slate-800"
                                        />
                                        <circle
                                            cx="40" cy="40" r="32"
                                            stroke="currentColor" strokeWidth="5" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 32}
                                            strokeDashoffset={2 * Math.PI * 32 - (progress / 100) * 2 * Math.PI * 32}
                                            className="text-cyan-500 transition-all duration-1000 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
                                            strokeLinecap="round"
                                        />
                                        {/* Animated Tip */}
                                        <g style={{ transform: `rotate(${(progress / 100) * 360}deg)`, transformOrigin: '40px 40px', transition: 'transform 1s linear' }}>
                                            <circle cx="72" cy="40" r="3" fill="#fff" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                                        </g>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center scale-75">
                                        <div className="flex items-baseline gap-[1px] text-cyan-50 drop-shadow-md font-mono tracking-tighter">
                                            <span className="text-2xl font-bold">{minutesLeftDisplay}</span>
                                            <span className="text-xs text-cyan-400 opacity-80 mb-1">:</span>
                                            <span className="text-lg font-semibold text-cyan-200">{secondsLeftDisplay.toString().padStart(2, '0')}</span>
                                        </div>
                                        <div className="text-[9px] text-cyan-400/60 -mt-1 font-medium tracking-widest scale-90">{t('dashboard.remaining')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#1e293b]/50 p-1.5 rounded-xl text-center flex flex-col items-center justify-center border border-cyan-500/10 hover:border-cyan-500/30 transition-colors group">
                                    <div className="text-sm font-bold text-teal-400 font-mono tracking-tight group-hover:text-teal-300 transition-colors">{currency}{moneyEarned.toFixed(2)}</div>
                                    <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-center mt-0.5 group-hover:text-teal-400/70 transition-colors">
                                        <Banknote className="w-3 h-3 text-teal-500/70" /> {t('dashboard.earned')}
                                    </div>
                                </div>
                                <div className="bg-[#1e293b]/50 p-1.5 rounded-xl text-center flex flex-col items-center justify-center border border-cyan-500/10 hover:border-cyan-500/30 transition-colors group">
                                    <div className="text-sm font-bold text-blue-400 font-mono tracking-tight group-hover:text-blue-300 transition-colors">{formatLoafTime(totalLoafingSeconds)}</div>
                                    <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-center mt-0.5 group-hover:text-blue-400/70 transition-colors">
                                        <Timer className="w-3 h-3 text-blue-500/70" /> {t('dashboard.loafTime')}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => startLoafing('poop')}
                                        className="p-2 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/10 hover:border-orange-500/30 rounded-xl flex flex-col items-center gap-1 transition-all group"
                                    >
                                        <PoopIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform drop-shadow-lg" />
                                        <span className="text-[9px] text-orange-200/60 group-hover:text-orange-200/80">{t('dashboard.paidPoop')}</span>
                                    </button>
                                    <button
                                        onClick={() => startLoafing('fake-update')}
                                        className="p-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-xl flex flex-col items-center gap-1 transition-all group"
                                    >
                                        <RefreshCw className="w-5 h-5 text-blue-400 group-hover:rotate-180 transition-transform duration-500 drop-shadow-lg" />
                                        <span className="text-[9px] text-blue-200/60 group-hover:text-blue-200/80">{t('dashboard.fakeUpdate')}</span>
                                    </button>
                                    <button
                                        onClick={() => startLoafing('fake-coding')}
                                        className="p-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl flex flex-col items-center gap-1 transition-all group"
                                    >
                                        <Code className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform drop-shadow-lg" />
                                        <span className="text-[9px] text-emerald-200/60 group-hover:text-emerald-200/80">{t('dashboard.fakeCoding')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Open Full App */}
                            <button
                                onClick={() => window.electron.ipcRenderer.send('open-main-window')}
                                className="w-full py-2 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border border-cyan-500/20 rounded-lg text-[10px] flex items-center justify-center gap-1.5 text-cyan-200/70 hover:text-cyan-100 transition-all group mt-1"
                            >
                                <span>{t('dashboard.openFull')}</span>
                                <Maximize2 className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pond"
                            custom={(currentView as string) === 'pond' ? 1 : -1}
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0f172a] to-[#164e63] overflow-hidden"
                        >
                            {/* Ocean Background Effects */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                            <div className="absolute top-0 left-0 w-full h-[50px] bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none z-10" />

                            <div className="absolute top-2 left-3 z-20 flex items-center gap-2">
                                <h3 className="text-lg font-bold text-cyan-100 flex items-center gap-2 drop-shadow-md">
                                    <Fish className="w-5 h-5 text-cyan-400" />
                                    <span>{t('dashboard.pond')} ({collectedFish?.length || 0})</span>
                                </h3>
                            </div>

                            {(!collectedFish || collectedFish.length === 0) ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 gap-2 opacity-100 relative z-30 pointer-events-auto">
                                    <div className="animate-bounce text-2xl">🐟</div>
                                    <div className="text-xs font-medium">{t('dashboard.swimming')}</div>
                                    <button
                                        onClick={() => setCollectedFish([{ emoji: '🐠', type: '测试小鱼', rarity: 'Common' }, { emoji: '🐡', type: '测试河豚', rarity: 'Rare' }, { emoji: '🦈', type: '测试鲨鱼', rarity: 'Epic' }])}
                                        className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 px-2 py-1 rounded-full border border-cyan-500/20 transition-colors mt-1"
                                    >
                                        {t('dashboard.summonFish')}
                                    </button>
                                </div>
                            ) : (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {/* Swimming Fish Animation */}
                                    {collectedFish.map((fish, i) => {
                                        const stats = getSwimStats(fish.id || i)
                                        const isRight = i % 2 === 0

                                        return (
                                            <motion.div
                                                key={`swim-${i}`}
                                                className="absolute select-none cursor-pointer pointer-events-auto hover:z-50 group"
                                                style={{
                                                    top: `${stats.top}%`,
                                                    filter: `blur(${stats.depth > 0.5 ? 0 : 0.5}px)`,
                                                    opacity: 0.9 + stats.depth * 0.1,
                                                    zIndex: 10 + Math.floor(stats.depth * 10)
                                                }}
                                                initial={{ x: isRight ? -50 : 350 }}
                                                animate={{ x: isRight ? 350 : -50 }}
                                                transition={{
                                                    duration: stats.duration,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                    delay: stats.delay
                                                }}
                                            >
                                                <div
                                                    className={`text-3xl transform ${isRight ? '-scale-x-100' : 'scale-x-100'} transition-transform duration-300 hover:scale-[1.3] drop-shadow-md`}
                                                    title={`${fish.type} (${fish.rarity})`}
                                                >
                                                    {fish.emoji}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Bottom Decor */}
                            <div className="absolute bottom-0 left-0 w-full h-[60px] bg-[url('https://i.imgur.com/3q555.png')] opacity-20 pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


        </div>
    )
}

// Custom Poop Icon since Lucide doesn't have one
const PoopIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M10 12h4" />
        <path d="M12 21c-3.13 0-6.88-2.65-6.88-7.88a7.13 7.13 0 0 1 .53-2.62L3 9v-.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.5l.63 1.25a6.5 6.5 0 0 1 12.74 0l.63-1.25v-.5a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.5l-2.65 1.5a7.13 7.13 0 0 1 .53 2.62c0 5.23-3.75 7.88-6.88 7.88Z" />
    </svg>
)

export default Dashboard

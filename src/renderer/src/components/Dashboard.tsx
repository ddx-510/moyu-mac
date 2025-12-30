import React, { useState, useEffect } from 'react'
import { Banknote, Timer, Eye, EyeOff, RefreshCw, Code, Fish, Settings, Power, Maximize2 } from 'lucide-react'

const Dashboard: React.FC = () => {
    const [totalLoafingSeconds, setTotalLoafingSeconds] = useState(0)
    const [moneyEarned, setMoneyEarned] = useState(0)
    const [isLoafing, setIsLoafing] = useState(false)
    const [loafType, setLoafType] = useState<string | null>(null)
    const [loafStart, setLoafStart] = useState<number | null>(null)
    const [loafElapsed, setLoafElapsed] = useState(0)

    // Work timer
    const [workStartTime, setWorkStartTime] = useState(Date.now())
    const [now, setNow] = useState(Date.now())

    const [currency, setCurrency] = useState('¥')
    const [isTracking, setIsTracking] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            const history = await window.electron.ipcRenderer.invoke('get-settings', 'breakHistory') || []
            const salary = await window.electron.ipcRenderer.invoke('get-settings', 'salary') || 10000
            const c = await window.electron.ipcRenderer.invoke('get-settings', 'currencySymbol')
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

    const WORK_INTERVAL_MINS = 60
    // Calculate elapsed minutes based on actual start time from main process
    const elapsedSeconds = Math.max(0, (now - workStartTime) / 1000)
    const minutesWorked = Math.floor(elapsedSeconds / 60)
    // Cap at 60 mins for display
    const displayMinutes = Math.min(minutesWorked, WORK_INTERVAL_MINS)
    const progress = (displayMinutes / WORK_INTERVAL_MINS) * 100
    const minutesLeft = Math.max(0, WORK_INTERVAL_MINS - displayMinutes)

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

        new Notification('摸鱼助手', {
            body: newState ? '已开启自动检测 👀' : '已暂停自动检测 🙈',
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
                    <div className="text-sm text-gray-400 mb-2">正在摸鱼中...</div>
                    <div className="text-4xl font-mono font-bold text-green-400 mb-6">
                        {formatLoafTime(loafElapsed)}
                    </div>
                    <button
                        onClick={stopLoafing}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-medium transition-all"
                    >
                        结束摸鱼
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 w-72 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] backdrop-blur-xl rounded-2xl border border-cyan-500/10 text-white shadow-2xl flex flex-col gap-2 overflow-hidden ring-1 ring-cyan-500/20">

            {/* Header: Controls */}
            <div className="flex justify-between items-center px-1">
                {/* Tracking Toggle */}
                <button
                    onClick={toggleTracking}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${isTracking ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-slate-800/50 text-slate-500'}`}
                    title={isTracking ? "正在自动检测摸鱼" : "摸鱼检测已暂停"}
                >
                    {isTracking ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                {/* Right Actions: Settings & Quit */}
                <div className="flex gap-1">
                    <button
                        onClick={() => window.electron.ipcRenderer.send('open-settings')}
                        className="p-1.5 hover:bg-cyan-500/10 rounded-lg text-slate-400 hover:text-cyan-200 transition-colors"
                        title="设置"
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => window.electron.ipcRenderer.send('quit-app')}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        title="退出"
                    >
                        <Power className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Circular Progress (Shifted Up) */}
            <div className="flex flex-col items-center relative -mt-2">
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
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-xl font-bold text-cyan-50 drop-shadow-md">{minutesLeft}m</div>
                        <div className="text-[9px] text-cyan-400/70 -mt-0.5 font-medium">倒计时</div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1e293b]/50 p-1.5 rounded-xl text-center flex flex-col items-center justify-center border border-cyan-500/10 hover:border-cyan-500/30 transition-colors group">
                    <div className="text-sm font-bold text-teal-400 font-mono tracking-tight group-hover:text-teal-300 transition-colors">{currency}{moneyEarned.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-center mt-0.5 group-hover:text-teal-400/70 transition-colors">
                        <Banknote className="w-3 h-3 text-teal-500/70" /> 已白嫖
                    </div>
                </div>
                <div className="bg-[#1e293b]/50 p-1.5 rounded-xl text-center flex flex-col items-center justify-center border border-cyan-500/10 hover:border-cyan-500/30 transition-colors group">
                    <div className="text-sm font-bold text-blue-400 font-mono tracking-tight group-hover:text-blue-300 transition-colors">{formatLoafTime(totalLoafingSeconds)}</div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1 justify-center mt-0.5 group-hover:text-blue-400/70 transition-colors">
                        <Timer className="w-3 h-3 text-blue-500/70" /> 摸鱼时长
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
                        <span className="text-[9px] text-orange-200/60 group-hover:text-orange-200/80">带薪拉屎</span>
                    </button>
                    <button
                        onClick={() => startLoafing('fake-update')}
                        className="p-2 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                        <RefreshCw className="w-5 h-5 text-blue-400 group-hover:rotate-180 transition-transform duration-500 drop-shadow-lg" />
                        <span className="text-[9px] text-blue-200/60 group-hover:text-blue-200/80">需要更新了</span>
                    </button>
                    <button
                        onClick={() => startLoafing('fake-coding')}
                        className="p-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl flex flex-col items-center gap-1 transition-all group"
                    >
                        <Code className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform drop-shadow-lg" />
                        <span className="text-[9px] text-emerald-200/60 group-hover:text-emerald-200/80">假装努力</span>
                    </button>
                </div>
            </div>

            {/* Open Full App */}
            <button
                onClick={() => window.electron.ipcRenderer.send('open-main-window')}
                className="w-full py-2 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border border-cyan-500/20 rounded-lg text-[10px] flex items-center justify-center gap-1.5 text-cyan-200/70 hover:text-cyan-100 transition-all group mt-1"
            >
                <span>打开完整应用</span>
                <Maximize2 className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
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

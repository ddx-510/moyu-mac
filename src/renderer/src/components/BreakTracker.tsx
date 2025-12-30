import React, { useState, useEffect } from 'react'

interface BreakLog {
    id: number
    type: string
    startTime: number
    duration: number
    date: string
}

const BreakTracker: React.FC = () => {
    const [isThinking, setIsThinking] = useState(false) // active break
    const [startTime, setStartTime] = useState<number | null>(null)
    const [elapsed, setElapsed] = useState(0)
    const [breakType, setBreakType] = useState('💩 Poop')
    const [history, setHistory] = useState<BreakLog[]>([])

    // Load history
    useEffect(() => {
        const loadHistory = async () => {
            const h = await window.electron.ipcRenderer.invoke('get-settings', 'breakHistory')
            if (Array.isArray(h)) {
                setHistory(h)
            }
        }
        loadHistory()
    }, [])

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isThinking && startTime) {
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isThinking, startTime])

    const startBreak = (type: string) => {
        setBreakType(type)
        setStartTime(Date.now())
        setIsThinking(true)
        setElapsed(0)
    }

    const endBreak = async () => {
        if (!startTime) return

        const newLog: BreakLog = {
            id: Date.now(),
            type: breakType,
            startTime,
            duration: elapsed,
            date: new Date().toLocaleDateString()
        }

        const newHistory = [newLog, ...history]
        setHistory(newHistory)
        setIsThinking(false)
        setStartTime(null)
        setElapsed(0)

        // Persist
        await window.electron.ipcRenderer.invoke('set-settings', 'breakHistory', newHistory)

        // Update Total Loafing Seconds (Earn on Loaf)
        window.electron.ipcRenderer.invoke('get-settings', 'totalLoafingSeconds').then((total: number) => {
            const newTotal = (total || 0) + elapsed
            window.electron.ipcRenderer.invoke('set-settings', 'totalLoafingSeconds', newTotal)
        })

        // Notify main process loafing stopped
        window.electron.ipcRenderer.send('stop-loafing')
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="text-white max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Break Tracker</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tracker Section */}
                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[300px]">
                    {isThinking ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="text-6xl mb-4 animate-bounce">{breakType.split(' ')[0]}</div>
                            <div className="text-xl text-gray-400 mb-2">You are currently:</div>
                            <div className="text-2xl font-bold mb-6">{breakType.split(' ').slice(1).join(' ')}</div>
                            <div className="text-6xl font-mono font-bold text-orange-400 mb-8">{formatTime(elapsed)}</div>
                            <button
                                onClick={endBreak}
                                className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-full font-bold transition-colors"
                            >
                                Finish Break
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <h3 className="text-lg text-gray-400 mb-6 text-center">Start a new break</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => startBreak('💩 Poop')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2">
                                    <span className="text-4xl">💩</span>
                                    <span className="font-medium">Poop</span>
                                </button>
                                <button onClick={() => startBreak('🚬 Smoke')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2">
                                    <span className="text-4xl">🚬</span>
                                    <span className="font-medium">Smoke</span>
                                </button>
                                <button onClick={() => startBreak('☕ Coffee')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2">
                                    <span className="text-4xl">☕</span>
                                    <span className="font-medium">Coffee</span>
                                </button>
                                <button onClick={() => startBreak('🐟 Fish')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2">
                                    <span className="text-4xl">🐟</span>
                                    <span className="font-medium">Touch Fish</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col h-[500px]">
                    <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
                        History
                        <span className="text-xs font-normal text-gray-500">Total: {history.length}</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-gray-500 text-center mt-20">No breaks recorded yet.</div>
                        ) : (
                            history.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg text-sm border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{log.type.split(' ')[0]}</span>
                                        <div>
                                            <div className="font-medium text-gray-200">{log.type.split(' ').slice(1).join(' ')}</div>
                                            <div className="text-xs text-gray-500">{new Date(log.startTime).toLocaleTimeString()} · {log.date}</div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-orange-300 font-medium">
                                        {formatTime(log.duration)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BreakTracker

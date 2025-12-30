import React, { useState, useEffect, useRef } from 'react'

const FocusTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [initialTime, setInitialTime] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus')

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false)
            new Notification('Loafing Timer', { body: 'Time is up!' })
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') // Simple ding
            audio.play().catch(e => console.error(e))

            // Earn on Loaf: If mode is short or long, add time to total
            if (mode === 'short' || mode === 'long') {
                const duration = initialTime // Full duration completed
                window.electron.ipcRenderer.invoke('get-settings', 'totalLoafingSeconds').then((total: number) => {
                    const newTotal = (total || 0) + duration
                    window.electron.ipcRenderer.invoke('set-settings', 'totalLoafingSeconds', newTotal)
                })
            }

            window.electron.ipcRenderer.send('stop-loafing')
        }
        return () => clearInterval(interval)
    }, [isRunning, timeLeft, mode, initialTime])

    const toggleTimer = () => setIsRunning(!isRunning)

    const resetTimer = () => {
        setIsRunning(false)
        setTimeLeft(initialTime)
    }

    const setTimerMode = (newMode: 'focus' | 'short' | 'long') => {
        setMode(newMode)
        setIsRunning(false)
        let time = 25 * 60
        if (newMode === 'short') time = 5 * 60
        if (newMode === 'long') time = 15 * 60
        setInitialTime(time)
        setTimeLeft(time)
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const progress = ((initialTime - timeLeft) / initialTime) * 100
    const circumference = 2 * Math.PI * 120 // Radius 120

    return (
        <div className="flex flex-col items-center justify-center h-full text-white">
            {/* Mode Switcher */}
            <div className="flex gap-2 mb-12 bg-white/5 p-1 rounded-full border border-white/10">
                <button
                    onClick={() => setTimerMode('focus')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'focus' ? 'bg-purple-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Focus (25m)
                </button>
                <button
                    onClick={() => setTimerMode('short')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'short' ? 'bg-green-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Short Break (5m)
                </button>
                <button
                    onClick={() => setTimerMode('long')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'long' ? 'bg-blue-600 shadow-lg text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Long Break (15m)
                </button>
            </div>

            {/* Timer Display */}
            <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                {/* SVG Progress Circle */}
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                        cx="160"
                        cy="160"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                    />
                    <circle
                        cx="160"
                        cy="160"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (progress / 100) * circumference}
                        className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'text-purple-500' : mode === 'short' ? 'text-green-500' : 'text-blue-500'}`}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Text */}
                <div className="text-7xl font-mono font-bold tracking-tighter z-10">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-6">
                <button
                    onClick={toggleTimer}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-xl transition-all ${isRunning ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
                >
                    {isRunning ? '⏸' : '▶'}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all"
                >
                    ↺
                </button>
            </div>
        </div>
    )
}

export default FocusTimer

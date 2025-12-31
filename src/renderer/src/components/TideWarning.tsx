import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, RefreshCw, Code, X } from 'lucide-react'

// Reuse the swim stats logic (can be exported or duplicated)
const getSwimStats = (id: number) => {
    const rand = (seed: number) => {
        const x = Math.sin(id + seed) * 10000
        return x - Math.floor(x)
    }
    return {
        top: 10 + rand(1) * 80,
        duration: 25 + rand(2) * 35, // Slower: 25-60s duration
        delay: rand(3) * -20,
        depth: rand(4),
        scale: 0.8 + rand(5) * 0.5
    }
}

// Custom Poop Icon
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

interface TideWarningProps {
    isOpen?: boolean
    onClose?: () => void
    fish?: any[]
}

const TideWarning: React.FC<TideWarningProps> = ({ isOpen = true, onClose, fish }) => {
    const [localFish, setLocalFish] = useState<any[]>(fish || [])

    useEffect(() => {
        // If no fish passed (standalone mode), fetch them
        if (!fish) {
            // @ts-ignore
            window.electron.ipcRenderer.invoke('get-settings', 'fish').then((f) => {
                setLocalFish(f || [])
            })
        } else {
            setLocalFish(fish)
        }
    }, [fish])

    const handleClose = () => {
        if (onClose) {
            onClose()
        } else {
            // @ts-ignore
            window.electron.ipcRenderer.send('close-tide-warning')
        }
    }

    const startLoafing = (type: string) => {
        // @ts-ignore
        window.electron.ipcRenderer.send('start-loafing', type)
        // Window close is handled by Main process now
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden font-sans select-none"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    {/* Backdrop/Overlay - Click to close */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-colors cursor-pointer"
                        onClick={handleClose}
                    />

                    {/* Rising Water Container */}
                    <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: "60%" }} // Go a bit above half
                        exit={{ height: "0%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 40 }} // Slower spring
                        style={{ transform: "translateZ(0)" }} // GPU hint
                        className="w-full bg-gradient-to-t from-cyan-900/95 via-cyan-700/90 to-cyan-500/80 relative overflow-hidden pointer-events-auto rounded-t-[50px] shadow-2xl border-t border-cyan-300/20"
                    >
                        {/* Wave Decor on Top - Optimized (No Blur) */}
                        <div className="absolute top-0 left-0 w-full transform -translate-y-1/2 opacity-30">
                            <div className="w-[200%] h-16 bg-white/10 animate-pulse rounded-full" />
                        </div>

                        {/* Content Container */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-40 p-4">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                                className="text-center flex flex-col items-center"
                            >
                                <div className="mb-4 p-5 bg-white/10 rounded-full ring-1 ring-white/30 shadow-2xl animate-bounce">
                                    <Coffee className="w-12 h-12 text-orange-200 drop-shadow-md" />
                                </div>
                                <h2 className="text-4xl font-bold drop-shadow-lg mb-2 tracking-tight">休息一下吧!</h2>
                                <p className="text-cyan-100 text-lg mb-8 font-medium">工作辛苦了，选一种方式放松一下？ 🌊</p>

                                {/* Action Buttons Grid */}
                                <div className="flex gap-4 mb-6">
                                    <button
                                        onClick={() => startLoafing('poop')}
                                        className="w-32 h-32 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-lg group"
                                    >
                                        <PoopIcon className="w-10 h-10 text-orange-300 group-hover:scale-110 transition-transform drop-shadow-md" />
                                        <span className="font-bold text-orange-100 group-hover:text-white">带薪拉屎</span>
                                    </button>

                                    <button
                                        onClick={() => startLoafing('fake-update')}
                                        className="w-32 h-32 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-lg group"
                                    >
                                        <RefreshCw className="w-10 h-10 text-blue-300 group-hover:rotate-180 transition-transform duration-700 drop-shadow-md" />
                                        <span className="font-bold text-blue-100 group-hover:text-white">需要更新</span>
                                    </button>

                                    <button
                                        onClick={() => startLoafing('fake-coding')}
                                        className="w-32 h-32 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-lg group"
                                    >
                                        <Code className="w-10 h-10 text-emerald-300 group-hover:scale-110 transition-transform drop-shadow-md" />
                                        <span className="font-bold text-emerald-100 group-hover:text-white">假装努力</span>
                                    </button>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="text-cyan-200/60 hover:text-white text-sm hover:underline transition-colors mt-2"
                                >
                                    暂时不需要，谢谢
                                </button>
                            </motion.div>
                        </div>

                        {/* Swimming Fish (Rising with water) - Optimized & Direction Fix */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
                            {localFish.map((f, i) => {
                                const stats = getSwimStats(f.id || i)
                                const isRight = i % 2 === 0 // Starts Left, moving Right
                                return (
                                    <motion.div
                                        key={`tide-fish-${i}`}
                                        className="absolute text-6xl drop-shadow-md opacity-90"
                                        style={{
                                            top: `${stats.top}%`,
                                            filter: `blur(${stats.depth > 0.5 ? 0 : 0.5}px)`,
                                            zIndex: 10,
                                            scale: stats.scale
                                        }}
                                        initial={{ x: isRight ? -150 : '110vw' }}
                                        animate={{ x: isRight ? '110vw' : -150 }}
                                        transition={{
                                            duration: stats.duration,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: stats.delay
                                        }}
                                    >
                                        <div style={{ transform: isRight ? 'scaleX(-1)' : 'scaleX(1)' }}>
                                            {f.emoji}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Bubbles / Texture - Optimized */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none" />

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default TideWarning

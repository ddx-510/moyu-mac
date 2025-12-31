import React, { useState, useEffect, useMemo } from 'react'
import { Waves, Clock, Calendar, BarChart3, History, MousePointerClick, Monitor, Fish, Armchair, Gamepad2, Utensils, Coffee, Cigarette, RefreshCw, Code } from 'lucide-react'
import { motion } from 'framer-motion'

type TimeRange = 'day' | 'week' | 'month' | 'year'


interface BreakSession {
    id: number
    type: string
    startTime: number
    duration: number
    date: string
}

interface DisplayItem {
    id: string
    label: string
    duration: number
    details: string
    count: number
    type?: string
    breakdown?: { type: string, duration: number, count: number }[]
}

const ScreenTimeStats: React.FC = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('week')
    const [breakHistory, setBreakHistory] = useState<BreakSession[]>([])
    const [totalSeconds, setTotalSeconds] = useState(0)
    const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null)

    useEffect(() => {
        const loadData = async () => {
            const history = await window.electron.ipcRenderer.invoke('get-settings', 'breakHistory') || []
            setBreakHistory(history.sort((a: BreakSession, b: BreakSession) => b.startTime - a.startTime))
            const total = await window.electron.ipcRenderer.invoke('get-settings', 'totalLoafingSeconds') || 0
            setTotalSeconds(total)
        }
        loadData()
    }, [])

    const { displayItems, rangeTotal, sessionCount } = useMemo(() => {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        const startOfWeek = startOfDay - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400000
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime()

        let filtered = breakHistory
        let items: DisplayItem[] = []

        const getBreakdown = (sessions: BreakSession[]) => {
            const map = new Map<string, { duration: number, count: number }>()
            sessions.forEach(s => {
                const existing = map.get(s.type) || { duration: 0, count: 0 }
                map.set(s.type, { duration: existing.duration + s.duration, count: existing.count + 1 })
            })
            return Array.from(map.entries()).map(([type, data]) => ({ type, ...data })).sort((a, b) => b.duration - a.duration)
        }

        if (timeRange === 'day') {
            filtered = breakHistory.filter(s => s.startTime >= startOfDay)
            items = filtered.map(s => ({
                id: s.id.toString(),
                label: new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: s.duration,
                details: new Date(s.startTime).toLocaleString(),
                count: 1,
                type: s.type
            }))
        } else if (timeRange === 'week') {
            for (let i = 0; i < 7; i++) {
                const dayTime = startOfWeek + i * 86400000
                const dayStart = new Date(dayTime)
                const dayEnd = dayTime + 86400000
                const daySessions = breakHistory.filter(s => s.startTime >= dayTime && s.startTime < dayEnd)
                const totalDuration = daySessions.reduce((a, b) => a + b.duration, 0)

                items.push({
                    id: `week-${i}`,
                    label: dayStart.getDate().toString(),
                    duration: totalDuration,
                    details: dayStart.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                    count: daySessions.length,
                    breakdown: getBreakdown(daySessions)
                })
            }
        } else if (timeRange === 'month') {
            const year = now.getFullYear()
            const month = now.getMonth()
            const daysInMonth = new Date(year, month + 1, 0).getDate()

            for (let i = 1; i <= daysInMonth; i++) {
                const dayTime = new Date(year, month, i).getTime()
                const dayEnd = dayTime + 86400000
                const daySessions = breakHistory.filter(s => s.startTime >= dayTime && s.startTime < dayEnd)
                const totalDuration = daySessions.reduce((a, b) => a + b.duration, 0)

                items.push({
                    id: `month-${i}`,
                    label: i.toString(),
                    duration: totalDuration,
                    details: new Date(year, month, i).toLocaleDateString(),
                    count: daySessions.length,
                    breakdown: getBreakdown(daySessions)
                })
            }
        } else {
            const year = now.getFullYear()
            for (let i = 0; i < 12; i++) {
                const monthStart = new Date(year, i, 1).getTime()
                const monthEnd = new Date(year, i + 1, 0, 23, 59, 59).getTime()
                const monthSessions = breakHistory.filter(s => s.startTime >= monthStart && s.startTime <= monthEnd)
                const totalDuration = monthSessions.reduce((a, b) => a + b.duration, 0)

                items.push({
                    id: `year-${i}`,
                    label: `${i + 1}月`,
                    duration: totalDuration,
                    details: `${year}年 ${i + 1}月`,
                    count: monthSessions.length,
                    breakdown: getBreakdown(monthSessions)
                })
            }
        }

        const total = items.reduce((acc, curr) => acc + curr.duration, 0)
        const count = items.reduce((acc, curr) => acc + curr.count, 0)
        return { displayItems: items, rangeTotal: total, sessionCount: count }
    }, [breakHistory, timeRange])

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.floor(seconds)}s`
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    // 🐟 Fish size based on duration - uses emoji
    const getFishSize = (duration: number) => {
        if (duration === 0) return 'text-sm opacity-20'
        const mins = duration / 60
        if (mins < 5) return 'text-lg'
        if (mins < 15) return 'text-2xl'
        if (mins < 30) return 'text-3xl'
        if (mins < 60) return 'text-4xl'
        return 'text-5xl drop-shadow-[0_0_10px_rgba(0,200,255,0.5)]'
    }

    const cleanName = (name: string) => {
        // Use alternation | instead of [] to handle surrogate pairs correctly without u flag issues
        // Includes: 👀, 💩, 🐟, 🖥️, ⌨️
        return name.replace(/^(👀|💩|🐟|🖥️|⌨️)\s*/, '').replace(/\s*(👀|💩|🐟|🖥️|⌨️)$/, '')
    }

    const getIcon = (type: string = '') => {
        const lowerType = type.toLowerCase()
        if (type === '带薪拉屎' || type === 'Poop' || lowerType.includes('拉屎') || lowerType.includes('poop')) return <Armchair className="w-5 h-5 text-orange-400" />
        if (type.includes('Fake Update') || type.includes('假更新')) return <RefreshCw className="w-5 h-5 text-blue-400" />
        if (type.includes('Fake Coding') || type.includes('假编程')) return <Code className="w-5 h-5 text-emerald-400" />
        if (lowerType.includes('游戏') || lowerType.includes('game') || lowerType.includes('steam')) return <Gamepad2 className="w-5 h-5 text-purple-400" />
        if (type === 'Fish' || lowerType.includes('fish') || lowerType.includes('摸鱼')) return <Fish className="w-5 h-5 text-cyan-400" />
        if (type === 'Smoke' || lowerType.includes('smoke')) return <Cigarette className="w-5 h-5 text-gray-400" />
        if (type.includes('饭') || type.includes('食')) return <Utensils className="w-5 h-5 text-yellow-400" />
        if (type === 'Coffee' || type.includes('咖啡') || type.includes('茶') || type.includes('休息')) return <Coffee className="w-5 h-5 text-emerald-400" />
        return <Monitor className="w-5 h-5 text-cyan-400" />
    }

    return (
        <div className="text-white h-full flex flex-col overflow-y-auto">
            {/* ... Header ... */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-2xl font-bold">🐟 摸鱼统计</h2>
                <div className="grid grid-cols-4 gap-1 bg-slate-900/50 p-1 rounded-xl backdrop-blur-sm border border-cyan-500/10 relative min-w-[280px]">
                    {(['day', 'week', 'month', 'year'] as TimeRange[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors relative z-10 text-center ${timeRange === t ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-200'}`}
                        >
                            {timeRange === t && (
                                <motion.div
                                    layoutId="activeTimeRange"
                                    className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)] rounded-lg -z-10"
                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                />
                            )}
                            {t === 'day' ? '今日' : t === 'week' ? '本周' : t === 'month' ? '本月' : '今年'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 rounded-xl border border-cyan-500/20 mb-4 flex justify-between items-center shrink-0">
                <div>
                    <div className="text-gray-400 text-xs flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        {timeRange === 'day' ? '今日' : timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '今年'}摸鱼
                    </div>
                    <div className="text-3xl font-bold font-mono text-cyan-400">{formatTime(rangeTotal)}</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 flex items-center justify-end gap-1 mb-1">
                        {sessionCount} 次 <MousePointerClick className="w-3 h-3" />
                    </div>
                    <div className="text-gray-300 font-mono text-sm flex items-center justify-end gap-1">
                        总计 {formatTime(totalSeconds)} <BarChart3 className="w-3 h-3" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {timeRange === 'day' ? (
                    /* DAILY: List View */
                    displayItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <Waves className="w-20 h-20 mb-4 text-cyan-500/20" />
                            <p>今天还没摸鱼～</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                                            {getIcon(item.type)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{cleanName(item.type || '摸鱼')}</div>
                                            <div className="text-xs text-gray-500">{item.label}</div>
                                        </div>
                                    </div>
                                    <div className="text-green-400 font-mono text-sm">{formatTime(item.duration)}</div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* WEEK/MONTH/YEAR: Grid View - Ocean! */
                    <div className="bg-gradient-to-b from-cyan-900/30 to-blue-900/40 rounded-2xl border border-cyan-500/20 p-4 min-h-[300px]">
                        <div className={`grid gap-2 ${timeRange === 'week' ? 'grid-cols-7' :
                            timeRange === 'year' ? 'grid-cols-4' :
                                'grid-cols-7'
                            }`}>
                            {displayItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => item.duration > 0 && setSelectedItem(item)}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border relative overflow-hidden
                                        ${item.duration > 0
                                            ? 'bg-black/30 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-400/40 cursor-pointer group'
                                            : 'bg-black/10 border-white/5'
                                        }`}
                                >
                                    {/* Bubbles effect for active items */}
                                    {item.duration > 0 && <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-400/10 transition-colors pointer-events-none"></div>}

                                    <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                                    <div className={getFishSize(item.duration)}>
                                        🐟
                                    </div>
                                    {item.duration > 0 && (
                                        <div className="text-[9px] text-gray-400 mt-1">{formatTime(item.duration)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedItem(null)}>
                    <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 w-80 max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-2">🐟</div>
                            <h3 className="text-lg font-bold">{selectedItem.details}</h3>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 mb-4 text-center">
                            <div className="text-3xl font-bold text-green-400 font-mono">{formatTime(selectedItem.duration)}</div>
                            <div className="text-gray-500 text-sm mt-1">{selectedItem.count} 次摸鱼</div>
                        </div>

                        {/* Breakdown List */}
                        {selectedItem.breakdown && selectedItem.breakdown.length > 0 && (
                            <div className="mb-4 max-h-40 overflow-y-auto custom-scrollbar border-t border-white/5 pt-2">
                                <div className="text-xs text-gray-500 mb-2 pl-1">摸鱼详情</div>
                                <div className="space-y-1.5">
                                    {selectedItem.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs px-2 py-1 bg-white/5 rounded">
                                            <div className="flex items-center gap-2 max-w-[140px]">
                                                {getIcon(item.type)}
                                                <span className="truncate" title={cleanName(item.type)}>{cleanName(item.type)}</span>
                                            </div>
                                            <div className="flex gap-2 text-gray-400">
                                                <span>{item.count}次</span>
                                                <span className="font-mono text-cyan-400">{formatTime(item.duration)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={() => setSelectedItem(null)}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg transition-all">
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScreenTimeStats

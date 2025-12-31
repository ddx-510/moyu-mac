import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Wallet, Timer, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MoneyCounter: React.FC = () => {
    const { t } = useTranslation()
    const [salary, setSalary] = useState<number>(0)
    const [workDays, setWorkDays] = useState<number>(22)
    const [workHours, setWorkHours] = useState<number>(8)
    const [totalLoafingSeconds, setTotalLoafingSeconds] = useState(0)
    const [showHourlyRate, setShowHourlyRate] = useState(false)

    const [currency, setCurrency] = useState('¥')

    useEffect(() => {
        const loadSettings = async () => {
            const s = await window.electron.ipcRenderer.invoke('get-settings', 'salary')
            const c = await window.electron.ipcRenderer.invoke('get-settings', 'currency')
            const d = await window.electron.ipcRenderer.invoke('get-settings', 'workDays')
            const h = await window.electron.ipcRenderer.invoke('get-settings', 'workHours')

            if (s) setSalary(Number(s))
            if (c) setCurrency(c)
            if (d) setWorkDays(Number(d))
            if (h) setWorkHours(Number(h))
        }
        loadSettings()

        // Poll for Total Loafing Seconds
        const fetchTotal = async () => {
            const total = await window.electron.ipcRenderer.invoke('get-settings', 'totalLoafingSeconds')
            setTotalLoafingSeconds(total || 0)
        }
        fetchTotal()
        const interval = setInterval(fetchTotal, 1000)
        return () => clearInterval(interval)
    }, [])

    // Calculation
    const moneyPerSecond = (salary && workDays && workHours)
        ? salary / (workDays * workHours * 3600)
        : 0

    const earned = totalLoafingSeconds * moneyPerSecond

    // Not configured - show prompt to go to settings
    if (!salary) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="mb-4 text-purple-400">
                    <Wallet className="w-20 h-20" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('money.notConfigured')}</h2>
                <p className="text-gray-400 mb-6 text-center">{t('money.notConfiguredDesc')}</p>
                <Link
                    to="/main/settings"
                    className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    {t('money.goToSettings')}
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-white">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">{t('money.earnings')}</h2>

            <div className="mb-12 text-center">
                <div className="text-7xl font-mono font-bold text-green-400 tabular-nums">
                    <span className="text-4xl mr-2 text-green-600">{currency}</span>
                    {earned.toFixed(4)}
                </div>

                <div className="mt-4 flex gap-4 text-sm text-gray-400 justify-center flex-wrap">
                    <button
                        onClick={() => setShowHourlyRate(!showHourlyRate)}
                        className="bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-colors group"
                    >
                        <Banknote className="w-4 h-4 text-gray-500" />
                        <span>{t('money.hourlyRate')}: </span>
                        <span className="font-mono">
                            {showHourlyRate
                                ? `${currency}${(moneyPerSecond * 3600).toFixed(2)}/h`
                                : '******'
                            }
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                            {showHourlyRate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </span>
                    </button>
                    <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-gray-500" />
                        {t('money.breakTime')}: {Math.floor(totalLoafingSeconds / 60)}{t('money.minutes')}
                    </div>
                </div>
            </div>

            <Link
                to="/main/settings"
                className="text-xs text-gray-600 hover:text-white underline transition-colors"
            >
                {t('money.editSalary')}
            </Link>
        </div>
    )
}

export default MoneyCounter


import React, { useState, useEffect } from 'react'
import { Banknote, Eye, EyeOff, ScanEye, Building2, RotateCw, Check, X, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const DEFAULT_CURRENCIES = [
    { label: 'CNY (¥)', symbol: '¥' },
    { label: 'USD ($)', symbol: '$' },
    { label: 'SGD (S$)', symbol: 'S$' },
    { label: 'GBP (£)', symbol: '£' },
    { label: 'EUR (€)', symbol: '€' },
    { label: 'JPY (¥)', symbol: 'JP¥' },
    { label: 'KRW (₩)', symbol: '₩' },
]

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
]

const Settings: React.FC = () => {
    const { t, i18n } = useTranslation()
    // string type for salary to allow empty input (no leading 0)
    const [salary, setSalary] = useState<string>('')
    const [currency, setCurrency] = useState<string>('¥')
    const [workDays, setWorkDays] = useState<string>('22')
    const [workHours, setWorkHours] = useState<string>('8')

    // Whitelist Logic
    const [workAppsArray, setWorkAppsArray] = useState<string[]>([])
    const [runningApps, setRunningApps] = useState<string[]>([])
    const [manualInput, setManualInput] = useState('')
    const [currentApp, setCurrentApp] = useState<string>('')
    const [appIcons, setAppIcons] = useState<Record<string, string>>({})

    const [activeTab, setActiveTab] = useState<'general' | 'whitelist' | 'salary'>('general')
    const [isTracking, setIsTracking] = useState(true)
    const [showSalary, setShowSalary] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load initial settings
    useEffect(() => {
        const loadSettings = async () => {
            const s = await window.electron.ipcRenderer.invoke('get-settings', 'salary')
            if (s) setSalary(s)

            const c = await window.electron.ipcRenderer.invoke('get-settings', 'currency')
            if (c) setCurrency(c)

            const wd = await window.electron.ipcRenderer.invoke('get-settings', 'workDays')
            if (wd) setWorkDays(wd)

            const wh = await window.electron.ipcRenderer.invoke('get-settings', 'workHours')
            if (wh) setWorkHours(wh)

            const wa = await window.electron.ipcRenderer.invoke('get-settings', 'workApps')
            if (wa) setWorkAppsArray(wa)

            // Refresh running apps initially
            refreshRunningApps()

            const tracking = await window.electron.ipcRenderer.invoke('get-tracking-status')
            setIsTracking(tracking)

            setIsLoaded(true)
        }

        loadSettings()

        // Poll for current app
        const interval = setInterval(async () => {
            const app = await window.electron.ipcRenderer.invoke('get-active-app')
            setCurrentApp(app)
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    // Auto-save effects
    // Debounced save for text inputs
    useEffect(() => {
        if (!isLoaded) return

        const timer = setTimeout(async () => {
            await window.electron.ipcRenderer.invoke('set-settings', 'salary', salary)
            await window.electron.ipcRenderer.invoke('set-settings', 'workDays', workDays)
            await window.electron.ipcRenderer.invoke('set-settings', 'workHours', workHours)
            // console.log('Auto-saved text settings')
        }, 800)

        return () => clearTimeout(timer)
    }, [salary, workDays, workHours, isLoaded])

    // Immediate save for selects/toggles
    useEffect(() => {
        if (!isLoaded) return
        window.electron.ipcRenderer.invoke('set-settings', 'currency', currency)
    }, [currency, isLoaded])

    useEffect(() => {
        if (!isLoaded) return
        window.electron.ipcRenderer.invoke('set-settings', 'workApps', workAppsArray)
    }, [workAppsArray, isLoaded])

    const toggleTracking = async () => {
        const newState = await window.electron.ipcRenderer.invoke('toggle-tracking', !isTracking)
        setIsTracking(newState)
    }

    const refreshRunningApps = async () => {
        const apps = await window.electron.ipcRenderer.invoke('get-running-apps')
        setRunningApps(apps)
        // Fetch icons for all apps
        fetchIconsForApps(apps)
    }

    const fetchIconsForApps = async (apps: string[]) => {
        const iconsToFetch: Record<string, string> = {}
        for (const app of apps) {
            try {
                const icon = await window.electron.ipcRenderer.invoke('get-app-icon', app)
                if (icon && typeof icon === 'string' && icon.startsWith('data:')) {
                    iconsToFetch[app] = icon
                }
            } catch (e) {
                console.error('[Settings] Error fetching icon for', app, e)
            }
        }
        if (Object.keys(iconsToFetch).length > 0) {
            setAppIcons(prev => ({ ...prev, ...iconsToFetch }))
        }
    }

    // Fetch icons for whitelist apps on load
    useEffect(() => {
        if (workAppsArray.length > 0) {
            fetchIconsForApps(workAppsArray)
        }
    }, [workAppsArray])

    const toggleApp = (app: string) => {
        if (workAppsArray.includes(app)) {
            setWorkAppsArray(workAppsArray.filter(a => a !== app))
        } else {
            setWorkAppsArray([...workAppsArray, app])
        }
    }

    const addManualApp = () => {
        if (manualInput && !workAppsArray.includes(manualInput)) {
            setWorkAppsArray([...workAppsArray, manualInput])
            setManualInput('')
        }
    }

    return (
        <div className="text-white max-w-2xl mx-auto flex flex-col gap-6 pb-8">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 filter drop-shadow-sm">
                    {t('settings.title')}
                </h2>
                <div className="grid grid-cols-3 gap-1 bg-slate-900/50 p-1 rounded-xl backdrop-blur-sm border border-cyan-500/10 relative min-w-[320px]">
                    {['general', 'salary', 'whitelist'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-colors relative z-10 text-center ${activeTab === tab ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-200'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)] rounded-lg -z-10"
                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                />
                            )}
                            {tab === 'general' ? t('settings.general') : tab === 'salary' ? t('settings.salary') : t('settings.whitelist')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 relative overflow-y-scroll" style={{ scrollbarGutter: 'stable' }}>
                {activeTab === 'general' && (
                    <motion.div
                        key="general"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Language Selector */}
                        <div className="bg-[#1e293b]/50 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/10 shadow-lg ring-1 ring-cyan-500/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                        <Globe className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg mb-1 text-cyan-50">{t('settings.language')}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-cyan-500/10">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => i18n.changeLanguage(lang.code)}
                                            className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${i18n.language.startsWith(lang.code)
                                                ? 'text-cyan-300'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {i18n.language.startsWith(lang.code) && (
                                                <motion.div
                                                    layoutId="langPill"
                                                    className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/30 rounded-lg"
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative z-10">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Auto Tracking Toggle */}
                        <div className="bg-[#1e293b]/50 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/10 flex items-center justify-between shadow-lg ring-1 ring-cyan-500/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                    <ScanEye className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg mb-1 text-cyan-50">{t('settings.autoTracking')}</div>
                                    <div className="text-xs text-slate-400">{t('settings.autoTrackingDesc')}</div>
                                </div>
                            </div>
                            <button
                                onClick={toggleTracking}
                                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-inner ${isTracking ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-700'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 ${isTracking ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-[#1e293b]/30 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/5">
                            <h4 className="text-sm font-bold text-slate-400 mb-2">{t('settings.about')}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {t('settings.aboutDesc')}
                            </p>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-500/10 backdrop-blur-md p-4 rounded-2xl border border-red-500/20">
                            <h4 className="text-sm font-bold text-red-400 mb-3">{t('settings.dangerZone')}</h4>
                            <button
                                onClick={async () => {
                                    if (confirm(t('settings.clearConfirm'))) {
                                        await window.electron.ipcRenderer.invoke('set-settings', 'breakHistory', [])
                                        await window.electron.ipcRenderer.invoke('set-settings', 'fish', [])
                                        await window.electron.ipcRenderer.invoke('set-settings', 'totalLoafingSeconds', 0)
                                        alert(t('settings.cleared'))
                                    }
                                }}
                                className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 text-sm transition-colors"
                            >
                                {t('settings.clearAllData')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'salary' && (
                    <motion.div
                        key="salary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="bg-[#1e293b]/50 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/10 shadow-xl relative overflow-hidden group ring-1 ring-cyan-500/5">
                            <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/10 transition-all duration-1000"></div>

                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10 text-cyan-50">
                                <Banknote className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> {t('settings.salaryTitle')}
                            </h3>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs text-cyan-200/70 uppercase tracking-widest mb-2 px-1">{t('settings.currency')}</label>
                                    <div className="relative">
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-50 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 appearance-none cursor-pointer transition-colors hover:bg-slate-900/70"
                                        >
                                            {DEFAULT_CURRENCIES.map(c => (
                                                <option key={c.symbol} value={c.symbol}>{c.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs text-cyan-200/70 uppercase tracking-widest mb-2 px-1">{t('settings.monthlySalary')}</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50 font-mono">{currency}</div>
                                        <input
                                            type={showSalary ? "number" : "password"}
                                            className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-xl pl-10 pr-10 py-3 text-cyan-50 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono text-lg placeholder-slate-700"
                                            value={salary}
                                            onChange={(e) => setSalary(e.target.value)}
                                            placeholder={showSalary ? "0" : "******"}
                                        />
                                        <button
                                            onClick={() => setShowSalary(!showSalary)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                                        >
                                            {showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-cyan-200/70 uppercase tracking-widest mb-2 px-1">{t('settings.workDays')}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-50 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono selection:bg-cyan-500/30"
                                        value={workDays}
                                        onChange={(e) => setWorkDays(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-cyan-200/70 uppercase tracking-widest mb-2 px-1">{t('settings.workHours')}</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-50 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors font-mono selection:bg-cyan-500/30"
                                        value={workHours}
                                        onChange={(e) => setWorkHours(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'whitelist' && (
                    <motion.div
                        key="whitelist"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-cyan-50">
                            <Building2 className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /> {t('settings.whitelistTitle')}
                        </h3>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-xs text-cyan-200/70 uppercase tracking-widest">{t('settings.runningApps')}</label>
                                <button onClick={refreshRunningApps} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group">
                                    <RotateCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" /> {t('common.refresh')}
                                </button>
                            </div>
                            <div className="bg-[#1e293b]/50 rounded-xl p-2 border border-cyan-500/10 max-h-48 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 shadow-inner">
                                {runningApps.length === 0 && <div className="w-full text-center text-slate-600 py-4 text-xs">{t('settings.emptyList')}</div>}
                                {runningApps.map(app => (
                                    <button
                                        key={app}
                                        onClick={() => toggleApp(app)}
                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all border flex items-center gap-1.5 ${workAppsArray.includes(app)
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.1)]'
                                            : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                            }`}
                                    >
                                        {appIcons[app] ? (
                                            <img src={appIcons[app]} alt="" className="w-4 h-4 rounded-sm" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-sm bg-slate-600/50" />
                                        )}
                                        {app}
                                        {workAppsArray.includes(app) && <Check className="w-3 h-3 text-cyan-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-cyan-200/70 uppercase tracking-widest mb-3 block">{t('settings.activeWhitelist')}</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder={t('settings.inputAppName')}
                                    className="flex-1 bg-slate-900/50 border border-cyan-500/20 rounded-xl px-4 py-2 text-cyan-50 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 text-sm placeholder-slate-600"
                                    onKeyDown={(e) => e.key === 'Enter' && addManualApp()}
                                />
                                <button onClick={addManualApp} className="px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-sm transition-colors text-cyan-400 hover:text-cyan-300">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-[#1e293b]/30 rounded-xl min-h-[50px] border border-cyan-500/10">
                                {workAppsArray.length === 0 && <span className="text-slate-600 text-xs self-center">{t('settings.noWhitelist')}</span>}
                                {workAppsArray.map(app => (
                                    <div key={app} className="px-3 py-1.5 rounded-lg text-xs bg-teal-500/10 border border-teal-500/20 text-teal-200 flex items-center gap-2 group cursor-default shadow-sm">
                                        {appIcons[app] ? (
                                            <img src={appIcons[app]} alt="" className="w-4 h-4 rounded-sm" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-sm bg-teal-600/30" />
                                        )}
                                        {app}
                                        <button onClick={() => toggleApp(app)} className="text-teal-500/50 hover:text-red-400 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="mt-6 pt-4 border-t border-cyan-500/10 flex items-center justify-between text-xs">
                            <span className="text-slate-500">{t('settings.detecting')}: <span className="text-cyan-400 font-mono">{currentApp}</span></span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div >
    )
}
export default Settings

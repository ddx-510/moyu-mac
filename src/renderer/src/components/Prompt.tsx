import React from 'react'
import { Monitor, Code, X, Coffee } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Prompt: React.FC = () => {
    const { t } = useTranslation()

    const handleChoice = (type: string) => {
        window.electron.ipcRenderer.send('start-loafing', type)
    }

    const handleDismiss = () => {
        window.electron.ipcRenderer.send('dismiss-prompt')
    }

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="z-10 w-full max-w-md flex flex-col items-center">
                <div className="mb-6 p-4 bg-cyan-500/10 rounded-full border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-bounce">
                    <Coffee className="w-10 h-10 text-cyan-400" />
                </div>

                <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-200">
                    {t('prompt.takeBreak')}
                </h1>
                <p className="text-slate-400 mb-8 text-center text-sm leading-relaxed max-w-xs">
                    {t('prompt.workedHour')}<br />
                    {t('prompt.breakIsWork')}
                </p>

                <div className="grid grid-cols-3 gap-3 w-full mb-8">
                    <button
                        onClick={() => handleChoice('poop')}
                        className="group p-4 bg-[#1e293b]/50 hover:bg-[#1e293b] border border-orange-500/20 hover:border-orange-500/50 rounded-2xl flex flex-col items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)]"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <PoopIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <span className="text-xs font-bold text-orange-200/80 group-hover:text-orange-100">{t('prompt.paidPoop')}</span>
                    </button>

                    <button
                        onClick={() => handleChoice('fake-update')}
                        className="group p-4 bg-[#1e293b]/50 hover:bg-[#1e293b] border border-blue-500/20 hover:border-blue-500/50 rounded-2xl flex flex-col items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <Monitor className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-xs font-bold text-blue-200/80 group-hover:text-blue-100">{t('prompt.fakeUpdate')}</span>
                    </button>

                    <button
                        onClick={() => handleChoice('fake-coding')}
                        className="group p-4 bg-[#1e293b]/50 hover:bg-[#1e293b] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl flex flex-col items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <Code className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-emerald-200/80 group-hover:text-emerald-100">{t('prompt.fakeCoding')}</span>
                    </button>
                </div>

                <button
                    onClick={handleDismiss}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 text-xs transition-all hover:shadow-lg backdrop-blur-sm"
                >
                    <X className="w-3.5 h-3.5" />
                    {t('prompt.keepWorking')}
                </button>
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

export default Prompt


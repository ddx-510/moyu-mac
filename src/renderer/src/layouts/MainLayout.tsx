import React, { useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Fish, Wallet, PieChart, SettingsIcon } from 'lucide-react'

import logo from '../assets/logo.png'

const MainLayout: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const handler = (_event: any, type: string) => {
            // Navigate based on prompt choice
            if (type === 'stats') {
                navigate('/main/stats')
            } else if (type === 'forest') {
                navigate('/main/forest')
            } else if (type === 'settings') {
                navigate('/main/settings')
            }
        }
        window.electron.ipcRenderer.on('navigate-to', handler)

        return () => {
            // Proper cleanup to prevent memory leak
            window.electron.ipcRenderer.removeAllListeners('navigate-to')
        }
    }, [navigate])

    const navItems = [
        { path: '/main', label: '鱼塘', icon: Fish },
        { path: '/main/money', label: '已白嫖', icon: Wallet },
        { path: '/main/stats', label: '摸鱼统计', icon: PieChart },
        { path: '/main/settings', label: '设置', icon: SettingsIcon }
    ]

    return (
        <div className="flex h-screen bg-gradient-to-br from-[#0f172a] to-[#082f49] text-white selection:bg-cyan-500/30">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-cyan-500/10 flex flex-col">
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-10 h-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    />
                    <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
                        摸鱼
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                                    ? 'text-cyan-400'
                                    : 'text-slate-400 hover:text-cyan-100'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActive"
                                        className="absolute inset-0 bg-cyan-500/10 border-r-2 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.1)] rounded-xl"
                                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 transition-transform duration-300 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className={`font-medium relative z-10 ${isActive ? 'tracking-wide' : ''}`}>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Version Info */}
                <div className="p-6 text-center">
                    <div className="text-xs text-slate-600 font-mono">v1.0.0 Ocean Edition</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-transparent relative">
                {/* Subtle Water Caustics/Glow Effect (Optional background decoration) */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.05),transparent_50%)] pointer-events-none" />
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="p-8 max-w-5xl mx-auto"
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    )
}

export default MainLayout

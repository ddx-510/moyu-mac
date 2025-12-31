import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import FakeUpdate from './components/FakeUpdate'
import FakeCoding from './components/FakeCoding'
import FishingGame from './components/FishingGame'
import MoneyCounter from './components/MoneyCounter'
import Settings from './components/Settings'
import Prompt from './components/Prompt'
import MainLayout from './layouts/MainLayout'
import FishPond from './components/ForestPage'
import ScreenTimeStats from './components/ScreenTimeStats'
import TideWarning from './components/TideWarning'

function App(): React.JSX.Element {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/fake-update" element={<FakeUpdate />} />
                <Route path="/fake-coding" element={<FakeCoding />} />
                <Route path="/fishing" element={<FishingGame />} />
                <Route path="/prompt" element={<Prompt />} />
                <Route path="/tide-warning" element={<TideWarning />} />

                {/* Main Window Routes */}
                <Route path="/main" element={<MainLayout />}>
                    <Route index element={<FishPond />} />
                    <Route path="forest" element={<FishPond />} />
                    <Route path="money" element={<MoneyCounter />} />
                    <Route path="stats" element={<ScreenTimeStats />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </HashRouter>
    )
}

export default App

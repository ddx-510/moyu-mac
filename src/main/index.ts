import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell, dialog, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIconAsset from '../../resources/trayTemplate.png?asset'
import { exec } from 'child_process'

let tray: Tray | null = null
let dashboardWindow: BrowserWindow | null = null
let fakeUpdateWindow: BrowserWindow | null = null
let fakeCodingWindow: BrowserWindow | null = null
let fishingWindow: BrowserWindow | null = null
let currentFishingSession: any = null
let preventingBlur = false

function createDashboardWindow(): void {
    // Create the browser window.
    dashboardWindow = new BrowserWindow({
        width: 300,
        height: 400,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    dashboardWindow.on('blur', () => {
        if (!preventingBlur && !dashboardWindow?.webContents.isDevToolsOpened()) {
            dashboardWindow?.hide()
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        dashboardWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        dashboardWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

function toggleDashboard() {
    if (!dashboardWindow) return
    if (dashboardWindow.isVisible()) {
        dashboardWindow.hide()
    } else {
        const { x, y, width, height } = tray!.getBounds()
        const { width: windowWidth, height: windowHeight } = dashboardWindow.getBounds()
        const scaleFactor = screen.getPrimaryDisplay().scaleFactor

        // Position near tray
        const yPos = Math.round(y >= height ? y - windowHeight : y + height) // Basic logic (top or bottom)
        // Actually on macOS, tray is usually top right.
        // getBounds returns screen coordinates.
        // We want to position it centered below the tray icon generally.

        const xPos = Math.round(x - windowWidth / 2 + width / 2)

        dashboardWindow.setPosition(xPos, yPos + 20) // Add some padding
        dashboardWindow.show()
        dashboardWindow.focus()
    }
}

function createTray() {
    const iconPath = trayIconAsset
    let iconImage = nativeImage.createFromPath(iconPath)

    if (iconImage.isEmpty()) {
        console.error('Failed to load tray icon from path:', iconPath)
        // Fallback
        iconImage = nativeImage.createFromBitmap(Buffer.alloc(16 * 16 * 4, 0xFF), { width: 16, height: 16 })
    }

    // Resize for macOS tray (usually 16x16 or 22x22 points)
    // For 'Template' image, macOS handles size often, but resizing ensures consistency.
    const trayIcon = iconImage.resize({ width: 22, height: 22 })
    trayIcon.setTemplateImage(true)

    tray = new Tray(trayIcon)
    tray.setToolTip('Moyu')

    tray.on('click', () => {
        toggleDashboard()
    })

    // Optional: Context menu
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open Dashboard', click: () => toggleDashboard() },
        { label: 'Fake Update', click: () => createFakeUpdateWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ])

    tray.on('right-click', () => {
        tray?.popUpContextMenu(contextMenu)
    })
}

let mainWindow: BrowserWindow | null = null

function createMainWindow() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
        return
    }

    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/main`)
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'main' })
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

const fs = require('fs')

// Fish Gacha System
interface Fish {
    id: number
    type: string
    emoji: string
    rarity: string
    caughtAt: number
    sessionDuration: number
}

const fishTiers = [
    { rarity: '普通', emoji: '🐟', name: '小鱼', weight: 60, minMinutes: 0 },
    { rarity: '稀有', emoji: '🐠', name: '金鱼', weight: 25, minMinutes: 5 },
    { rarity: '史诗', emoji: '🐡', name: '河豚', weight: 12, minMinutes: 15 },
    { rarity: '传说', emoji: '🦈', name: '鲨鱼', weight: 3, minMinutes: 30 },
]

function tryFishing(durationSeconds: number): Fish | null {
    const durationMinutes = durationSeconds / 60

    // Calculate catch chance: 30% base + 1% per minute (max 60%)
    const baseChance = 0.30
    const durationBonus = Math.min(durationMinutes * 0.01, 0.30)
    const catchChance = baseChance + durationBonus

    // Roll for catch
    if (Math.random() > catchChance) {
        return null // No catch
    }

    // Filter available tiers by duration
    const availableTiers = fishTiers.filter(t => durationMinutes >= t.minMinutes)

    // Calculate total weight
    const totalWeight = availableTiers.reduce((sum, t) => sum + t.weight, 0)

    // Roll for rarity
    let roll = Math.random() * totalWeight
    let selectedTier = availableTiers[0]

    for (const tier of availableTiers) {
        roll -= tier.weight
        if (roll <= 0) {
            selectedTier = tier
            break
        }
    }

    return {
        id: Date.now(),
        type: selectedTier.name,
        emoji: selectedTier.emoji,
        rarity: selectedTier.rarity,
        caughtAt: Date.now(),
        sessionDuration: durationSeconds
    }
}

let promptWindow: BrowserWindow | null = null
let workTimer: NodeJS.Timeout | null = null
let workTimeElapsed = 0
const WORK_INTERVAL = 60 * 60 * 1000 // 1 Hour
// const WORK_INTERVAL = 60 * 1000 // 60s Debug

function updateTrayIcon(percentage: number) {
    if (!tray) return

    // Calculate time remaining
    const totalMinutes = Math.round((WORK_INTERVAL / 1000 / 60) * (1 - percentage / 100))
    const displayText = totalMinutes > 0 ? `${totalMinutes}m` : '🔔'

    // Use setTitle for macOS menu bar (shows text next to icon)
    tray.setTitle(displayText)
}

function createPromptWindow() {
    if (promptWindow) {
        promptWindow.show()
        promptWindow.focus()
        return
    }

    promptWindow = new BrowserWindow({
        width: 400,
        height: 300,
        show: false,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        promptWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/prompt`)
    } else {
        promptWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'prompt' })
    }

    promptWindow.on('ready-to-show', () => {
        promptWindow?.show()
    })

    promptWindow.on('closed', () => {
        promptWindow = null
        // Reset timer if prompt is just closed without selection
        startWorkTimer()
    })
}

// Auto-Loafing System
let isAutoLoafing = false
let autoLoafStartTime = 0
let lastActiveAppName = ''
let detectionInterval: NodeJS.Timeout | null = null

function getActiveAppName(): Promise<string> {
    return new Promise((resolve) => {
        if (process.platform !== 'darwin') {
            resolve('')
            return
        }
        exec('osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'', (err, stdout) => {
            if (err) {
                resolve('')
            } else {
                resolve(stdout.trim())
            }
        })
    })
}

function stopAutoLoafingDetector() {
    if (detectionInterval) {
        clearInterval(detectionInterval)
        detectionInterval = null
    }
    isAutoLoafing = false
    autoLoafStartTime = 0
}

function startAutoLoafingDetector() {
    if (detectionInterval) clearInterval(detectionInterval)

    // Check master switch
    if (store && store.get('isTrackingEnabled', true) === false) {
        return
    }

    detectionInterval = setInterval(async () => {
        const activeApp = await getActiveAppName()
        if (!activeApp) return

        if (!activeApp) return

        // Get whitelist from store
        const workApps = (store?.get('workApps') as string[]) || []

        // Fuzzy match: If active app INCLUDES the whitelist item (e.g. "Google Chrome" includes "Chrome")
        const isWorkApp = workApps.some(app => {
            const filter = app.trim().toLowerCase()
            return filter && activeApp.toLowerCase().includes(filter)
        })

        if (isWorkApp) {
            // User is Working
            if (isAutoLoafing) {
                // End Auto-Loafing Session
                const duration = (Date.now() - autoLoafStartTime) / 1000
                if (duration > 5) { // Minimum 5 seconds to count
                    recordAutoLoafingSession(duration, lastActiveAppName)

                    // Show Notification
                    new Notification({
                        title: '摸鱼结束',
                        body: `刚刚在 ${lastActiveAppName} 摸鱼了 ${Math.round(duration)} 秒`,
                        silent: true // Don't play sound to be subtle? Or false? Let's keep it silent or default.
                    }).show()
                }
                isAutoLoafing = false
                autoLoafStartTime = 0
            }
        } else {
            // User is Loafing (Not in Work App)
            if (!isAutoLoafing) {
                // If whitelist is empty, assume EVERYTHING is work? Or nothing is work?
                // Usually if whitelist empty, better NOT to auto-loaf to avoid confusion.
                if (workApps.length === 0) return

                // Start Auto-Loafing Session
                isAutoLoafing = true
                autoLoafStartTime = Date.now()
            }
        }

        lastActiveAppName = activeApp // Update global state at end of tick
    }, 5000) // Check every 5 seconds
}

function recordAutoLoafingSession(duration: number, appName: string) {
    if (!store) return

    const currentTotal = store.get('totalLoafingSeconds') || 0
    store.set('totalLoafingSeconds', currentTotal + duration)

    const history = store.get('breakHistory') || []
    history.unshift({
        id: Date.now(),
        type: `👀 ${appName}`,
        startTime: Date.now() - duration * 1000,
        duration: duration,
        date: new Date().toLocaleDateString()
    })
    store.set('breakHistory', history)
}

let workStartTime = 0

function startWorkTimer() {
    if (workTimer) clearInterval(workTimer)
    workTimeElapsed = 0
    workStartTime = Date.now() // Track actual start time
    updateTrayIcon(0)

    // Update every 1 minute
    const UPDATE_INTERVAL = 60 * 1000
    // const UPDATE_INTERVAL = 1000 // Debug

    workTimer = setInterval(() => {
        workTimeElapsed += UPDATE_INTERVAL
        const percentage = (workTimeElapsed / WORK_INTERVAL) * 100
        updateTrayIcon(percentage)

        if (workTimeElapsed >= WORK_INTERVAL) {
            createPromptWindow()
            stopWorkTimer()
        }
    }, UPDATE_INTERVAL)
}

function stopWorkTimer() {
    if (workTimer) {
        clearInterval(workTimer)
        workTimer = null
    }
}



// Global var check
declare global {
    var fakeUpdateStartTime: number
}

function createFakeUpdateWindow() {
    if (fakeUpdateWindow) {
        fakeUpdateWindow.show()
        return
    }

    global.fakeUpdateStartTime = Date.now()

    fakeUpdateWindow = new BrowserWindow({
        fullscreen: true,
        alwaysOnTop: true,
        kiosk: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        fakeUpdateWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/fake-update`)
    } else {
        fakeUpdateWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'fake-update' })
    }

    // Exit implementation via global shortcut or IPC could go here
    fakeUpdateWindow.webContents.on('before-input-event', (event, input) => {
        // Escape hatch: Cmd+Ctrl+Esc? Or just Esc for now
        if (input.key === 'Escape') {
            fakeUpdateWindow?.close()
            fakeUpdateWindow = null
            // Resume work timer when fake update closes?
            // Actually renderer should tell main when loafing stops.
            startWorkTimer()
        }
    })

    fakeUpdateWindow.on('closed', async () => {
        const closedDuration = store && global.fakeUpdateStartTime
            ? (Date.now() - global.fakeUpdateStartTime) / 1000
            : 0

        fakeUpdateWindow = null
        startWorkTimer()

        if (store && closedDuration > 0) {
            const currentTotal = store.get('totalLoafingSeconds') || 0
            store.set('totalLoafingSeconds', currentTotal + closedDuration)

            // Add to break history
            const history = store.get('breakHistory') || []
            history.unshift({
                id: Date.now(),
                type: '🖥️ 假更新',
                startTime: global.fakeUpdateStartTime,
                duration: closedDuration,
                date: new Date().toLocaleDateString()
            })
            store.set('breakHistory', history)

            const salary = store.get('salary') || 10000
            const days = store.get('workDays') || 22
            const hours = store.get('workHours') || 8
            const rate = salary / (days * hours * 3600)
            const earned = closedDuration * rate

            // Roll for fish immediately
            const hookedFish = tryFishing(closedDuration)

            if (hookedFish) {
                setTimeout(() => {
                    createFishingWindow({
                        duration: closedDuration,
                        earned: earned,
                        hookedFish: hookedFish
                    })
                }, 100)
            } else {
                setTimeout(() => {
                    app.focus({ steal: true })
                    dialog.showMessageBox({
                        type: 'info',
                        title: '摸鱼完成!',
                        message: `假更新结束`,
                        detail: `⏱️ 时长: ${(closedDuration / 60).toFixed(2)} 分钟\n💰 已白嫖: ¥${earned.toFixed(2)}\n🎣 没钓到鱼...`,
                        buttons: ['太棒了!'],
                        noLink: true
                    })
                }, 100)
            }
        }
    })
}

let fakeCodingStartTime = 0

function createFakeCodingWindow() {
    if (fakeCodingWindow) {
        fakeCodingWindow.show()
        return
    }

    fakeCodingStartTime = Date.now()

    fakeCodingWindow = new BrowserWindow({
        fullscreen: true,
        alwaysOnTop: true,
        frame: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        fakeCodingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/fake-coding`)
    } else {
        fakeCodingWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'fake-coding' })
    }

    fakeCodingWindow.webContents.on('before-input-event', (_event, input) => {
        if (input.key === 'Escape') {
            fakeCodingWindow?.close()
        }
    })

    fakeCodingWindow.on('closed', async () => {
        const closedDuration = store && fakeCodingStartTime
            ? (Date.now() - fakeCodingStartTime) / 1000
            : 0

        fakeCodingWindow = null
        startWorkTimer()

        if (store && closedDuration > 0) {
            const currentTotal = store.get('totalLoafingSeconds') || 0
            store.set('totalLoafingSeconds', currentTotal + closedDuration)

            // Add to break history
            const history = store.get('breakHistory') || []
            history.unshift({
                id: Date.now(),
                type: '⌨️ 假编程',
                startTime: fakeCodingStartTime,
                duration: closedDuration,
                date: new Date().toLocaleDateString()
            })
            store.set('breakHistory', history)

            const salary = store.get('salary') || 10000
            const days = store.get('workDays') || 22
            const hours = store.get('workHours') || 8
            const rate = salary / (days * hours * 3600)
            const earned = closedDuration * rate

            // Roll for fish immediately
            const hookedFish = tryFishing(closedDuration)

            if (hookedFish) {
                setTimeout(() => {
                    createFishingWindow({
                        duration: closedDuration,
                        earned: earned,
                        hookedFish: hookedFish
                    })
                }, 100)
            } else {
                setTimeout(() => {
                    app.focus({ steal: true })
                    dialog.showMessageBox({
                        type: 'info',
                        title: '摸鱼完成!',
                        message: `假编程结束`,
                        detail: `⏱️ 时长: ${(closedDuration / 60).toFixed(2)} 分钟\n💰 已白嫖: ¥${earned.toFixed(2)}\n🎣 没钓到鱼...`,
                        buttons: ['太棒了!'],
                        noLink: true
                    })
                }, 100)
            }
        }
    })
}

function createFishingWindow(data: { duration: number, earned: number, hookedFish?: Fish }) {
    if (fishingWindow) {
        fishingWindow.focus()
        return
    }

    currentFishingSession = data

    fishingWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        fishingWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/fishing`)
    } else {
        fishingWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'fishing' })
    }

    fishingWindow.on('ready-to-show', () => {
        fishingWindow?.show()
        fishingWindow?.focus()
    })

    fishingWindow.on('closed', () => {
        fishingWindow = null
        currentFishingSession = null
    })
}

// IPC Handlers

ipcMain.on('end-poop-session', (_event, duration) => {
    if (store && duration > 0) {
        const currentTotal = store.get('totalLoafingSeconds') || 0
        store.set('totalLoafingSeconds', currentTotal + duration)

        // Add to break history
        const history = store.get('breakHistory') || []
        history.unshift({
            id: Date.now(),
            type: '💩 带薪拉屎',
            startTime: Date.now() - duration * 1000,
            duration: duration,
            date: new Date().toLocaleDateString()
        })
        store.set('breakHistory', history)

        const salary = store.get('salary') || 10000
        const days = store.get('workDays') || 22
        const hours = store.get('workHours') || 8
        const rate = salary / (days * hours * 3600)
        const earned = duration * rate

        // Roll for fish immediately
        const hookedFish = tryFishing(duration)

        if (hookedFish) {
            setTimeout(() => {
                createFishingWindow({
                    duration: duration,
                    earned: earned,
                    hookedFish: hookedFish
                })
            }, 100)
        } else {
            setTimeout(() => {
                app.focus({ steal: true })

                // Try to use dashboard window as parent if visible/exists, otherwise null
                const parent = dashboardWindow && !dashboardWindow.isDestroyed() ? dashboardWindow : null

                const options = {
                    type: 'info' as const,
                    title: '摸鱼完成!',
                    message: `带薪拉屎结束`,
                    detail: `⏱️ 时长: ${(duration / 60).toFixed(2)} 分钟\n💰 已白嫖: ¥${earned.toFixed(2)}\n🎣 没钓到鱼...`,
                    buttons: ['爽!'],
                    noLink: true
                }

                if (parent) {
                    preventingBlur = true
                    dialog.showMessageBox(parent, options).finally(() => {
                        preventingBlur = false
                        // Optional: Hide dashboard after dialog closes?
                        // dashboardWindow?.hide() 
                    })
                } else {
                    dialog.showMessageBox(options)
                }
            }, 100)
        }
    }
})

ipcMain.handle('get-tracking-status', () => {
    return store ? store.get('isTrackingEnabled', true) : true
})

ipcMain.handle('toggle-tracking', (_, enabled: boolean) => {
    if (!store) return false
    store.set('isTrackingEnabled', enabled)
    if (enabled) {
        startAutoLoafingDetector()
    } else {
        stopAutoLoafingDetector()
    }
    return enabled
})

ipcMain.handle('open-fishing-window', () => {
    return currentFishingSession
})

ipcMain.handle('get-fishing-data', () => {
    return currentFishingSession
})

ipcMain.handle('get-work-start-time', () => {
    return workStartTime
})

ipcMain.on('fishing-complete', (_event, fish) => {
    if (store && fish) {
        const fishCollection = store.get('fish') || []
        fishCollection.push(fish)
        store.set('fish', fishCollection)
    }
})

ipcMain.on('close-fishing-window', () => {
    fishingWindow?.close()
})

ipcMain.on('open-main-window', () => {
    createMainWindow()
})

ipcMain.on('close-main-window', () => {
    mainWindow?.close()
})

ipcMain.on('quit-app', async () => {
    const { response } = await dialog.showMessageBox({
        type: 'question',
        title: '确定要跑路吗?',
        message: '真的要退出摸鱼助手吗？',
        detail: '退出后将无法自动统计摸鱼时长和工资哦！',
        buttons: ['退出', '继续摸鱼'],
        defaultId: 1,
        cancelId: 1
    })

    if (response === 0) {
        app.quit()
    }
})

ipcMain.on('navigate-to', (_event, type: string) => {
    // Forward navigation to main window
    if (mainWindow) {
        mainWindow.webContents.send('navigate-to', type)
    }
})

ipcMain.on('open-settings', () => {
    createMainWindow()
    // Wait for window to be ready before navigating
    if (mainWindow) {
        if (mainWindow.webContents.isLoading()) {
            mainWindow.webContents.once('did-finish-load', () => {
                mainWindow?.webContents.send('navigate-to', 'settings')
            })
        } else {
            mainWindow.webContents.send('navigate-to', 'settings')
        }
    }
})

ipcMain.on('start-loafing', (_event, type) => {
    // Renderer requested to start a specific loaf activity from Prompt
    if (promptWindow) promptWindow.close()

    // Logic for different types
    if (type === 'fake-update') {
        createFakeUpdateWindow()
    } else if (type === 'fake-coding') {
        createFakeCodingWindow()
    } else {
        // Poop or others: Open Main Window to specific tab
        createMainWindow()
        if (mainWindow) {
            mainWindow.webContents.send('navigate-to', type)
        }
    }
})

ipcMain.on('stop-loafing', () => {
    // Called when user actively stops a loafing session (e.g. stops Poop timer)
    startWorkTimer()
})

let store: any

ipcMain.handle('get-settings', (_event, key) => {
    return store ? store.get(key) : null
})

ipcMain.handle('get-active-app', () => {
    return lastActiveAppName
})

ipcMain.handle('get-running-apps', () => {
    return new Promise((resolve) => {
        if (process.platform !== 'darwin') {
            resolve([])
            return
        }
        exec('osascript -e \'tell application "System Events" to get name of every process where background only is false\'', (err, stdout) => {
            if (err) {
                resolve([])
            } else {
                // Split by comma and trim
                const apps = stdout.split(',').map(s => s.trim()).filter(Boolean)
                // Remove duplicates
                resolve([...new Set(apps)])
            }
        })
    })
})

ipcMain.handle('set-settings', (_event, key, value) => {
    if (store) store.set(key, value)
})

app.whenReady().then(async () => {
    const { default: Store } = await import('electron-store')
    store = new Store()

    electronApp.setAppUserModelId('com.electron')
    // ... rest of app ready logic assumes synchronous creates, but that's fine.
    // We just need store ready for IPC calls which come from renderer later.

    if (process.platform === 'darwin') {
        app.dock?.setIcon(nativeImage.createFromPath(icon))
    }

    createDashboardWindow()
    createTray()
    startWorkTimer()
    startAutoLoafingDetector()

    app.on('activate', function () {
        // macOS behavior: Click dock icon -> Open main window
        if (!mainWindow) {
            createMainWindow()
        } else {
            mainWindow.show()
        }

        // Also ensure dashboard exists (legacy safe-guard)
        if (!dashboardWindow || dashboardWindow.isDestroyed()) {
            createDashboardWindow()
        }
    })
})

app.on('window-all-closed', () => {
    // Check if tray is active, if so don't quit. 
    // Actually on macOS we usually don't quit.
    // But since we are LSUIElement (agent), we might want to stay alive.
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

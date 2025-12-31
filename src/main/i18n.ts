// Simple i18n helper for main process
// Syncs language from renderer via IPC, stores in electron-store

import { app } from 'electron'

const translations = {
    en: {
        tray: {
            openDashboard: 'Open Dashboard',
            fakeUpdate: 'Fake Update',
            quit: 'Quit'
        },
        notification: {
            breakEnded: 'Break Ended',
            breakEndedBody: 'Just slacked off in {{app}} for {{seconds}} seconds',
            breakComplete: 'Break Complete!',
            fakeUpdateEnded: 'Fake Update Ended',
            fakeCodingEnded: 'Fake Coding Ended',
            paidPoopEnded: 'Bathroom Break Ended',
            duration: 'Duration',
            minutes: 'min',
            earned: 'Earned',
            noFish: 'No fish caught...',
            awesome: 'Awesome!',
            nice: 'Nice!'
        },
        dialog: {
            confirmQuitTitle: 'Sure you want to leave?',
            confirmQuitMessage: 'Really quit Moyu?',
            confirmQuitDetail: 'You won\'t be able to track break time and earnings after quitting!',
            quit: 'Quit',
            keepGoing: 'Keep Slacking'
        },
        fish: {
            common: 'Common Fish',
            goldfish: 'Goldfish',
            pufferfish: 'Pufferfish',
            shark: 'Shark'
        },
        breakType: {
            fakeUpdate: 'Fake Update',
            fakeCoding: 'Fake Coding',
            paidPoop: 'Bathroom Break'
        }
    },
    zh: {
        tray: {
            openDashboard: '打开摸鱼面板',
            fakeUpdate: '假装更新',
            quit: '跑路'
        },
        notification: {
            breakEnded: '摸鱼结束',
            breakEndedBody: '刚刚在 {{app}} 摸鱼了 {{seconds}} 秒',
            breakComplete: '摸鱼完成!',
            fakeUpdateEnded: '假更新结束',
            fakeCodingEnded: '假编程结束',
            paidPoopEnded: '带薪蹲坑结束',
            duration: '时长',
            minutes: '分钟',
            earned: '已白嫖',
            noFish: '没钓到鱼...',
            awesome: '太棒了!',
            nice: '爽!'
        },
        dialog: {
            confirmQuitTitle: '确定要跑路吗?',
            confirmQuitMessage: '真的要退出摸鱼助手吗？',
            confirmQuitDetail: '退出后将无法自动统计摸鱼时长和工资哦！',
            quit: '退出',
            keepGoing: '继续摸鱼'
        },
        fish: {
            common: '小鱼',
            goldfish: '金鱼',
            pufferfish: '河豚',
            shark: '鲨鱼'
        },
        breakType: {
            fakeUpdate: '假更新',
            fakeCoding: '假编程',
            paidPoop: '带薪蹲坑'
        }
    }
}

let currentLang = 'zh' // Default

export function setLanguage(lang: string) {
    currentLang = lang.startsWith('en') ? 'en' : 'zh'
}

export function getLanguage(): string {
    return currentLang
}

export function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let result: any = translations[currentLang as keyof typeof translations]

    for (const k of keys) {
        result = result?.[k]
        if (!result) break
    }

    if (typeof result !== 'string') {
        // Fallback to English
        result = translations.en
        for (const k of keys) {
            result = result?.[k]
            if (!result) break
        }
    }

    if (typeof result !== 'string') return key

    // Replace params like {{app}}
    if (params) {
        for (const [paramKey, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value))
        }
    }

    return result
}

// Detect system language on startup
export function initLanguage() {
    const sysLang = app.getLocale()
    currentLang = sysLang.startsWith('zh') ? 'zh' : 'en'
}

/// <reference types="vite/client" />

declare module '*.png?asset' {
    const content: string
    export default content
}

interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    api: unknown
}

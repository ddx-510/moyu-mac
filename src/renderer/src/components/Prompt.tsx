import React from 'react'

const Prompt: React.FC = () => {
    const handleChoice = (type: string) => {
        window.electron.ipcRenderer.send('start-loafing', type)
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center border-4 border-purple-500/50">
            <h1 className="text-2xl font-bold mb-2 animate-bounce">👀 Eye Protection Alert!</h1>
            <p className="text-gray-400 mb-8 text-center text-sm">You've been working for 1 hour.<br />Time to take a break and grow your forest!</p>

            <div className="flex gap-4 w-full max-w-xs">
                <button
                    onClick={() => handleChoice('fake-update')}
                    className="flex-1 p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-105"
                >
                    <span className="text-4xl">🖥️</span>
                    <span className="text-sm font-bold">Fake Update</span>
                </button>

                <button
                    onClick={() => handleChoice('fake-coding')}
                    className="flex-1 p-6 bg-green-600 hover:bg-green-500 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-105"
                >
                    <span className="text-4xl">⌨️</span>
                    <span className="text-sm font-bold">Fake Coding</span>
                </button>
            </div>
        </div>
    )
}

export default Prompt

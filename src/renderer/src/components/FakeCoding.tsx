import React, { useState, useEffect } from 'react'

// More realistic code snippets from actual projects
const codeBlocks = [
    // React/TypeScript
    `import React, { useState, useEffect, useCallback } from 'react'`,
    `import { useQuery, useMutation } from '@tanstack/react-query'`,
    `import { z } from 'zod'`,
    ``,
    `const UserSchema = z.object({`,
    `  id: z.string().uuid(),`,
    `  email: z.string().email(),`,
    `  name: z.string().min(2).max(100),`,
    `  createdAt: z.date(),`,
    `})`,
    ``,
    `type User = z.infer<typeof UserSchema>`,
    ``,
    `interface Props {`,
    `  userId: string`,
    `  onUpdate?: (user: User) => void`,
    `}`,
    ``,
    `export const UserProfile: React.FC<Props> = ({ userId, onUpdate }) => {`,
    `  const [isEditing, setIsEditing] = useState(false)`,
    `  const [formData, setFormData] = useState<Partial<User>>({})`,
    ``,
    `  const { data: user, isLoading, error } = useQuery({`,
    `    queryKey: ['user', userId],`,
    `    queryFn: () => fetchUser(userId),`,
    `    staleTime: 5 * 60 * 1000,`,
    `  })`,
    ``,
    `  const mutation = useMutation({`,
    `    mutationFn: updateUser,`,
    `    onSuccess: (data) => {`,
    `      queryClient.invalidateQueries(['user', userId])`,
    `      onUpdate?.(data)`,
    `      setIsEditing(false)`,
    `    },`,
    `  })`,
    ``,
    `  const handleSubmit = useCallback(async (e: React.FormEvent) => {`,
    `    e.preventDefault()`,
    `    if (!formData.name || !formData.email) return`,
    `    await mutation.mutateAsync({ id: userId, ...formData })`,
    `  }, [formData, userId, mutation])`,
    ``,
    `  if (isLoading) return <LoadingSpinner />`,
    `  if (error) return <ErrorMessage error={error} />`,
    ``,
    `  return (`,
    `    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">`,
    `      <h1 className="text-2xl font-bold mb-4">{user?.name}</h1>`,
    `      {isEditing ? (`,
    `        <form onSubmit={handleSubmit} className="space-y-4">`,
    `          <input`,
    `            type="text"`,
    `            value={formData.name ?? user?.name ?? ''}`,
    `            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}`,
    `            className="w-full px-4 py-2 border rounded"`,
    `          />`,
    `          <button type="submit" disabled={mutation.isPending}>`,
    `            {mutation.isPending ? 'Saving...' : 'Save'}`,
    `          </button>`,
    `        </form>`,
    `      ) : (`,
    `        <button onClick={() => setIsEditing(true)}>Edit Profile</button>`,
    `      )}`,
    `    </div>`,
    `  )`,
    `}`,
    ``,
    `// API helpers`,
    `async function fetchUser(id: string): Promise<User> {`,
    `  const response = await fetch(\`/api/users/\${id}\`)`,
    `  if (!response.ok) throw new Error('Failed to fetch user')`,
    `  return UserSchema.parse(await response.json())`,
    `}`,
    ``,
    `async function updateUser(data: Partial<User> & { id: string }) {`,
    `  const response = await fetch(\`/api/users/\${data.id}\`, {`,
    `    method: 'PATCH',`,
    `    headers: { 'Content-Type': 'application/json' },`,
    `    body: JSON.stringify(data),`,
    `  })`,
    `  return UserSchema.parse(await response.json())`,
    `}`,
]

const FakeCoding: React.FC = () => {
    const [visibleLines, setVisibleLines] = useState(0)
    const [startTime] = useState(Date.now())
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000))
            setVisibleLines(prev => Math.min(prev + 1, codeBlocks.length))
        }, 300 + Math.random() * 200)

        return () => clearInterval(interval)
    }, [startTime])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.electron.ipcRenderer.send('close-fake-coding')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const highlightCode = (line: string) => {
        if (line.startsWith('//')) return 'text-gray-500 italic'
        if (line.startsWith('import') || line.startsWith('export')) return 'text-purple-400'
        if (line.includes('const ') || line.includes('let ') || line.includes('function')) return 'text-blue-400'
        if (line.includes('return')) return 'text-pink-400'
        if (line.includes('async') || line.includes('await')) return 'text-yellow-400'
        if (line.includes('=>')) return 'text-orange-400'
        return 'text-gray-300'
    }

    return (
        <div className="h-screen w-screen bg-[#1e1e1e] font-mono text-sm overflow-hidden flex">
            {/* Sidebar */}
            <div className="w-12 bg-[#252526] flex flex-col items-center py-4 gap-4 border-r border-[#3c3c3c]">
                <div className="w-6 h-6 bg-blue-500/20 rounded" />
                <div className="w-6 h-6 bg-gray-500/20 rounded" />
                <div className="w-6 h-6 bg-gray-500/20 rounded" />
            </div>

            {/* File Explorer */}
            <div className="w-48 bg-[#252526] border-r border-[#3c3c3c] p-2 text-xs text-gray-400">
                <div className="mb-2 text-[10px] uppercase tracking-wider">Explorer</div>
                <div className="text-white">▼ src</div>
                <div className="ml-3">▼ components</div>
                <div className="ml-6 text-blue-400">UserProfile.tsx</div>
                <div className="ml-6">Button.tsx</div>
                <div className="ml-3">▼ hooks</div>
                <div className="ml-6">useAuth.ts</div>
                <div className="ml-3">index.ts</div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col">
                {/* Tabs */}
                <div className="bg-[#252526] flex items-center h-9 border-b border-[#3c3c3c]">
                    <div className="px-4 py-2 bg-[#1e1e1e] text-white text-xs border-r border-[#3c3c3c]">
                        UserProfile.tsx
                    </div>
                    <div className="px-4 py-2 text-gray-500 text-xs">api.ts</div>
                    <div className="ml-auto mr-4 text-xs text-gray-600">
                        {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')} | ESC 退出
                    </div>
                </div>

                {/* Code Area */}
                <div className="flex-1 overflow-auto p-4">
                    {codeBlocks.slice(0, visibleLines).map((line, i) => (
                        <div key={i} className="flex leading-6">
                            <span className="w-10 text-right mr-4 text-gray-600 select-none">{i + 1}</span>
                            <span className={highlightCode(line)}>
                                {line}
                                {i === visibleLines - 1 && <span className="animate-pulse ml-0.5 text-white">|</span>}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-2 gap-4">
                    <span>TypeScript React</span>
                    <span>UTF-8</span>
                    <span>LF</span>
                    <span className="ml-auto">Ln {visibleLines}, Col 1</span>
                </div>
            </div>
        </div>
    )
}

export default FakeCoding

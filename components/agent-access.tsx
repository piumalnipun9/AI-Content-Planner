"use client"

import { useState, useTransition } from "react"
import { Copy, KeyRound, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createToken, revokeToken } from "@/app/actions/tokens"

type TokenRow = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null }

function CopyBlock({ text }: { text: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 pr-10 text-xs">{text}</pre>
      <button
        type="button"
        className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
        onClick={() => navigator.clipboard.writeText(text).then(() => toast.success("Copied"))}
        aria-label="Copy"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  )
}

export function AgentAccess({ endpoint, tokens }: { endpoint: string; tokens: TokenRow[] }) {
  const [name, setName] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const shown = token ?? "<YOUR_TOKEN>"

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1.5">
        <p className="font-medium">MCP endpoint</p>
        <CopyBlock text={endpoint} />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => {
            const r = await createToken(name)
            if (r.error) return void toast.error(r.error)
            setToken(r.token!)
            setName("")
          })
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name, e.g. Claude Code" />
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />} Create token
        </Button>
      </form>

      {token && (
        <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="font-medium text-amber-900">Copy this token now. It won&apos;t be shown again.</p>
          <CopyBlock text={token} />
        </div>
      )}

      {tokens.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="font-medium">{t.name}</span> <code className="text-xs text-muted-foreground">{t.prefix}…</code>
                <span className="block text-xs text-muted-foreground">
                  Created {new Date(t.createdAt).toLocaleDateString()} · {t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleString()}` : "never used"}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Revoke ${t.name}`}
                onClick={() => confirm(`Revoke "${t.name}"? Agents using it will lose access.`) && start(() => revokeToken(t.id))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer font-medium">How to connect an agent</summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p><span className="font-medium text-foreground">Claude Code</span></p>
          <CopyBlock text={`claude mcp add --transport http postpilot ${endpoint} --header "Authorization: Bearer ${shown}"`} />
          <p><span className="font-medium text-foreground">Any client with an mcp.json / mcpServers config</span> (Cursor, VS Code, Windsurf, Claude Desktop via mcp-remote…)</p>
          <CopyBlock
            text={JSON.stringify({ mcpServers: { postpilot: { type: "http", url: endpoint, headers: { Authorization: `Bearer ${shown}` } } } }, null, 2)}
          />
          <p><span className="font-medium text-foreground">Clients that only support local (stdio) servers</span></p>
          <CopyBlock
            text={JSON.stringify({ mcpServers: { postpilot: { command: "npx", args: ["-y", "mcp-remote", endpoint, "--header", `Authorization: Bearer ${shown}`] } } }, null, 2)}
          />
          <p>The agent acts as your account: it can create, edit, schedule and publish posts. Revoke a token here to cut off access.</p>
        </div>
      </details>
    </div>
  )
}

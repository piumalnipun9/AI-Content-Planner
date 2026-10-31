import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { userForToken } from "@/lib/api-tokens"
import { createMcpServer } from "@/lib/mcp/server"

// Content plans (Gemini) and Instagram publishing can take a minute or more
export const maxDuration = 300

/**
 * MCP endpoint (Streamable HTTP, stateless). Authenticate with
 * `Authorization: Bearer <token>` using a token created in Settings → Agent access.
 */
async function handle(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  const userId = token ? await userForToken(token) : null
  if (!userId) {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized: send Authorization: Bearer <Postpilot API token>" }, id: null },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="postpilot"' } },
    )
  }

  // Stateless: a fresh server per request, so it works the same on long-running and serverless hosts
  const server = createMcpServer(userId)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    void server.close()
  }
}

export { handle as GET, handle as POST, handle as DELETE }

import { Pinecone } from '@pinecone-database/pinecone'
import { PineconeStore } from '@langchain/pinecone'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

// Namespacing strategy: one namespace per user to isolate brand knowledge
export function userNamespace(userId: string) {
  return `user-${userId}`
}

export function getEmbeddings() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GOOGLE_API_KEY/GEMINI_API_KEY for embeddings')
  return new GoogleGenerativeAIEmbeddings({ apiKey, model: 'text-embedding-004' })
}

export async function getPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY
  if (!apiKey) throw new Error('Missing PINECONE_API_KEY')
  return new Pinecone({ apiKey })
}

export async function getVectorStore(indexName: string, namespace: string) {
  const client = await getPineconeClient()
  const index = client.Index(indexName)
  const embeddings = getEmbeddings()
  // Cast the index to any to avoid incompatible duplicate Pinecone types from different node_modules
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index as any,
    namespace,
  })
}

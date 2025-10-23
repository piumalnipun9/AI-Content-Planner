import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { getVectorStore, userNamespace } from './vectorstore'

export interface IngestInput {
  userId: string
  text: string
  metadata?: Record<string, any>
  indexName?: string // optional override; defaults to env PINECONE_INDEX
}

export async function ingestBrandText(input: IngestInput) {
  const indexName = input.indexName || process.env.PINECONE_INDEX
  if (!indexName) throw new Error('Missing PINECONE_INDEX')

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  })

  const docs = await splitter.createDocuments([input.text], [input.metadata || {}])
  const store = await getVectorStore(indexName, userNamespace(input.userId))

  await store.addDocuments(docs)

  return { chunks: docs.length }
}

import { getVectorStore, userNamespace } from './vectorstore'
import type { Document } from '@langchain/core/documents'

export async function retrieveContext(userId: string, query: string, k: number = 4, indexName?: string) {
  const idx = indexName || process.env.PINECONE_INDEX
  if (!idx) throw new Error('Missing PINECONE_INDEX')

  const store = await getVectorStore(idx, userNamespace(userId))
  const retriever = store.asRetriever(k)
  const docs: Document[] = await retriever.getRelevantDocuments(query)

  return docs.map((d: Document) => ({ content: d.pageContent as string, metadata: d.metadata }))
}

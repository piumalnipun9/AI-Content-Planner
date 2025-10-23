import type { PostGenerationRequest, GeneratedPostContent } from '@/lib/ai-service'
import { generateWithRag } from './chain'
import { GeminiService } from '@/lib/gemini-service'

export type GraphState = {
  request: PostGenerationRequest & { useRag?: boolean; topK?: number }
  result?: GeneratedPostContent
}

const decideNode = async (state: GraphState) => {
  return state.request.useRag ? 'rag' : 'direct'
}

const ragNode = async (state: GraphState) => {
  const result = await generateWithRag({ ...state.request, topK: state.request.topK })
  return { ...state, result }
}

const directNode = async (state: GraphState) => {
  const service = new GeminiService()
  const result = await service.generatePostContent(state.request)
  return { ...state, result }
}

export async function runGenerationGraph(req: GraphState['request']): Promise<GeneratedPostContent> {
  const state: GraphState = { request: req }

  const next = await decideNode(state)
  if (next === 'rag') {
    const newState = await ragNode(state)
    if (!newState.result) throw new Error('RAG path did not produce a result')
    return newState.result
  } else {
    const newState = await directNode(state)
    if (!newState.result) throw new Error('Direct path did not produce a result')
    return newState.result
  }
}

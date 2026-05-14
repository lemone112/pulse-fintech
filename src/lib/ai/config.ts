export const aiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL || '',
  apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || '',
  models: {
    embedding: process.env.NEXT_PUBLIC_AI_MODEL_EMBEDDING || 'text-embedding-3-small',
    cheap: process.env.NEXT_PUBLIC_AI_MODEL_CHEAP || 'gpt-4o-mini',
    base: process.env.NEXT_PUBLIC_AI_MODEL_BASE || 'gpt-4o',
    frontier: process.env.NEXT_PUBLIC_AI_MODEL_FRONTIER || 'o3',
  },
  mcp: {
    endpoints: (process.env.NEXT_PUBLIC_MCP_ENDPOINTS || '').split(',').filter(Boolean),
  },
}

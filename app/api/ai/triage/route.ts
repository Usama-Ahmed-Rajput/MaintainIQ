import { triageIssue } from '@/lib/ai-triage'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetName, assetCategory, description } = body

    if (!assetName || !assetCategory || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: assetName, assetCategory, description' },
        { status: 400 },
      )
    }

    const triage = await triageIssue(assetName, assetCategory, description)

    return NextResponse.json(triage, { status: 200 })
  } catch (error) {
    console.error('[v0] AI Triage API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process triage request' },
      { status: 500 },
    )
  }
}

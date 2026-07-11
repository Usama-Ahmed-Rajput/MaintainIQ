import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface TriageResult {
  category: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  possibleCauses: string[]
  initialChecks: string[]
  estimatedResolutionTime: string
  requiresSpecialist: boolean
  maintenanceSummary: string
}

export async function triageIssue(
  assetName: string,
  assetCategory: string,
  description: string,
): Promise<TriageResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are an expert maintenance and asset management AI. Analyze this maintenance issue and provide structured triage information.

Asset: ${assetName} (Category: ${assetCategory})
Issue Description: ${description}

Provide your response ONLY as valid JSON (no markdown, no code blocks) with exactly this structure:
{
  "category": "One of: Mechanical, Electrical, Plumbing, HVAC, Structural, Software, Other",
  "priority": "Low|Medium|High|Critical (Critical if safety risk or complete failure)",
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "initialChecks": ["check 1", "check 2", "check 3"],
  "estimatedResolutionTime": "e.g., 2-4 hours, 1-2 days",
  "requiresSpecialist": true or false,
  "maintenanceSummary": "One sentence summary of the issue and recommended action"
}

IMPORTANT: Return ONLY valid JSON, nothing else.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse the JSON response
    const triageData = JSON.parse(text)

    return {
      category: triageData.category || 'Other',
      priority: triageData.priority || 'Medium',
      possibleCauses: triageData.possibleCauses || [],
      initialChecks: triageData.initialChecks || [],
      estimatedResolutionTime: triageData.estimatedResolutionTime || '1-2 days',
      requiresSpecialist: triageData.requiresSpecialist || false,
      maintenanceSummary: triageData.maintenanceSummary || description,
    }
  } catch (error) {
    console.error('[v0] AI Triage Error:', error)
    // Return default triage if API fails
    return {
      category: 'Other',
      priority: 'Medium',
      possibleCauses: ['Unable to determine - manual inspection recommended'],
      initialChecks: ['Verify asset power status', 'Check for visible damage'],
      estimatedResolutionTime: '1-2 days',
      requiresSpecialist: true,
      maintenanceSummary: `Issue requires manual review: ${description}`,
    }
  }
}

export async function generateMaintenanceSummary(
  issueDescription: string,
  workPerformed: string,
  partsUsed?: string,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Generate a professional maintenance summary (2-3 sentences) for the following:

Issue: ${issueDescription}
Work Performed: ${workPerformed}
${partsUsed ? `Parts Used: ${partsUsed}` : ''}

Return only the summary text, no formatting.`

    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (error) {
    console.error('[v0] Summary Generation Error:', error)
    return `${workPerformed}. ${partsUsed ? `Parts used: ${partsUsed}.` : ''}`
  }
}

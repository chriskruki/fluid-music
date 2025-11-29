import { NextRequest, NextResponse } from 'next/server'

const TD_ENDPOINT = process.env.TD_ENDPOINT || 'http://localhost:8080'

export async function GET() {
  try {
    const response = await fetch(`${TD_ENDPOINT}/currentPrompt`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch prompt from TouchDesigner' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json(
      { error: 'Failed to connect to TouchDesigner endpoint' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = body.text || body.value || ''

    if (typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected string value.' },
        { status: 400 }
      )
    }

    const response = await fetch(`${TD_ENDPOINT}/updatePrompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update prompt in TouchDesigner' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to connect to TouchDesigner endpoint' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Twilio credentials - user needs to set these in env vars
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: Request) {
  try {
    const { phoneNumber, message, linkUrl } = await request.json()

    if (!phoneNumber || !linkUrl) {
      return NextResponse.json(
        { error: 'Phone number and link URL are required' },
        { status: 400 }
      )
    }

    // Check if Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { 
          error: 'SMS not configured',
          message: 'Twilio credentials not set. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.',
          linkUrl // Return the link so user can copy it
        },
        { status: 200 } // Return 200 so the UI can show the link
      )
    }

    // Format phone number (E.164 format)
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone // US numbers
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    // Send SMS via Twilio
    const twilioMessage = message 
      ? `${message}\n\nView your seat: ${linkUrl}`
      : `Check out this seat view: ${linkUrl}`

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: twilioMessage,
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Twilio error:', errorData)
      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          details: errorData.message,
          linkUrl
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'SMS sent successfully',
      linkUrl 
    })

  } catch (error: any) {
    console.error('Error sending SMS:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

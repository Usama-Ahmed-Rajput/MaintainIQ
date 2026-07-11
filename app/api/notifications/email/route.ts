import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/notifications/email
 * 
 * Send email notifications for:
 * - Issue assigned to technician
 * - Maintenance due reminder
 * - Issue resolved notification
 * - Asset service overdue alert
 * 
 * Using Resend.com (free tier)
 * Install: pnpm add resend
 * Env: RESEND_API_KEY
 */

type NotificationType = 'issue_assigned' | 'maintenance_due' | 'issue_resolved' | 'service_overdue'

interface EmailPayload {
  type: NotificationType
  toEmail: string
  toName: string
  subject: string
  data: Record<string, string | number | boolean>
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailPayload = await req.json()

    // For now, log notifications (add Resend integration later)
    console.log('[EMAIL NOTIFICATION]', {
      type: body.type,
      to: body.toEmail,
      subject: body.subject,
      timestamp: new Date().toISOString(),
      data: body.data,
    })

    // Future: Integrate with Resend API
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'notifications@maintainiq.com',
    //   to: body.toEmail,
    //   subject: body.subject,
    //   html: generateEmailHtml(body.type, body.data),
    // })

    return NextResponse.json({ success: true, message: 'Email notification logged' })
  } catch (error) {
    console.error('[EMAIL ERROR]', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

/**
 * Helper: Generate HTML email templates
 */
function generateEmailHtml(type: NotificationType, data: Record<string, string | number | boolean>): string {
  const templates: Record<NotificationType, string> = {
    issue_assigned: `
      <h2>New Issue Assigned</h2>
      <p>Hi ${data.technicianName},</p>
      <p>A new maintenance issue has been assigned to you:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName}</li>
        <li><strong>Issue:</strong> ${data.issuetitle}</li>
        <li><strong>Priority:</strong> ${data.priority}</li>
      </ul>
      <p><a href="${data.issueUrl}">View Issue →</a></p>
    `,
    maintenance_due: `
      <h2>Maintenance Reminder</h2>
      <p>Hi ${data.adminName},</p>
      <p>The following asset is due for maintenance soon:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName} (${data.assetCode})</li>
        <li><strong>Due Date:</strong> ${data.nextServiceDate}</li>
        <li><strong>Days Until Due:</strong> ${data.daysUntilDue}</li>
      </ul>
      <p><a href="${data.assetUrl}">Schedule Maintenance →</a></p>
    `,
    issue_resolved: `
      <h2>Issue Resolved</h2>
      <p>Hi ${data.reporterName},</p>
      <p>The issue you reported on ${data.assetName} has been resolved:</p>
      <ul>
        <li><strong>Issue:</strong> ${data.issueTitle}</li>
        <li><strong>Status:</strong> Resolved</li>
        <li><strong>Resolved On:</strong> ${data.resolvedDate}</li>
      </ul>
    `,
    service_overdue: `
      <h2>Service Overdue Alert</h2>
      <p>Hi ${data.adminName},</p>
      <p>The following asset is OVERDUE for maintenance:</p>
      <ul>
        <li><strong>Asset:</strong> ${data.assetName} (${data.assetCode})</li>
        <li><strong>Last Service:</strong> ${data.lastServiceDate}</li>
        <li><strong>Days Overdue:</strong> ${data.daysOverdue}</li>
      </ul>
      <p><a href="${data.assetUrl}">Take Action →</a></p>
    `,
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${templates[type]}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">
          This is an automated notification from MaintainIQ. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `
}

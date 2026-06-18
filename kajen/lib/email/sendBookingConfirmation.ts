import { Resend } from 'resend'

export type BookingConfirmationParams = {
  toEmail: string
  orderId: string
  serviceName: string
  formattedDates: string
  totalDkk: string
  tenantDisplayName: string
  tenantContactEmail: string
}

export async function sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!fromEmail) {
    console.error('[sendBookingConfirmation] RESEND_FROM_EMAIL is not set')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const shortId = params.orderId.replace(/-/g, '').slice(0, 8).toUpperCase()

  await resend.emails.send({
    from:    fromEmail,
    to:      params.toEmail,
    subject: `Booking bekræftet — ${params.serviceName} (${shortId})`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1e1e1e;">
        <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
          Booking bekræftet
        </h1>
        <p>Din betaling er modtaget og din booking er bekræftet.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Ordre-ID</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${shortId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Ydelse</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${params.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Dato</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${params.formattedDates}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Beløb</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${params.totalDkk}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #555;">
          Spørgsmål? Kontakt os på
          <a href="mailto:${params.tenantContactEmail}" style="color: #7a3010;">${params.tenantContactEmail}</a>.
        </p>
        <p style="font-size: 14px; color: #555;">
          Med venlig hilsen,<br>
          <strong>${params.tenantDisplayName}</strong>
        </p>
      </div>
    `,
  })
}

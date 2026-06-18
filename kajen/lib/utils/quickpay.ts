import { createHash } from 'crypto'

export function deriveOrderId(uuid: string): string {
  return createHash('sha256').update(uuid).digest('hex').slice(0, 20)
}

export function quickpayAuthHeader(): string {
  return 'Basic ' + Buffer.from(':' + process.env.QUICKPAY_API_KEY).toString('base64')
}

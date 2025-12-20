import crypto from 'crypto'
import { NextApiRequest, NextApiResponse } from 'next'
import { setCookie } from '@/lib/api/setCookie'

const SESSION_COOKIE_NAME = 'session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export type SessionPayload = {
  userId: string
  ionId: string
  admin: boolean
  issuedAt: number
}

const getSessionSecret = () => process.env.SESSION_COOKIE_SECRET || ''

const base64UrlEncode = (value: string) =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64').toString('utf8')
}

const signPayload = (payload: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

export const createSessionCookieValue = (payload: SessionPayload) => {
  const secret = getSessionSecret()
  if (!secret) return null
  const payloadString = JSON.stringify(payload)
  const encodedPayload = base64UrlEncode(payloadString)
  const signature = signPayload(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export const readSessionCookie = (req: NextApiRequest) => {
  const secret = getSessionSecret()
  if (!secret) return null
  const raw = req.cookies?.[SESSION_COOKIE_NAME]
  if (!raw) return null
  const [encodedPayload, signature] = raw.split('.')
  if (!encodedPayload || !signature) return null
  const expected = signPayload(encodedPayload, secret)
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== signatureBuffer.length) return null
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null
  try {
    const decoded = base64UrlDecode(encodedPayload)
    return JSON.parse(decoded) as SessionPayload
  } catch {
    return null
  }
}

export const setSessionCookie = (res: NextApiResponse, payload: SessionPayload) => {
  const value = createSessionCookieValue(payload)
  if (!value) return
  setCookie(res, SESSION_COOKIE_NAME, value, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE
  })
}

export const clearSessionCookie = (res: NextApiResponse) => {
  setCookie(res, SESSION_COOKIE_NAME, '', {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

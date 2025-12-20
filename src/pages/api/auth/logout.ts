import { clearSessionCookie } from '@/lib/api/sessionCookie'
import { setCookie } from '@/lib/api/setCookie'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  clearSessionCookie(res)
  setCookie(res, 'auth', '', {
    secure: true,
    httpOnly: false,
    sameSite: 'none',
    path: '/',
    maxAge: 0
  })
  res.status(200).json({ ok: true })
}

export default handler

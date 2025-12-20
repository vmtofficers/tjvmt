import { parsePath } from './../../../../lib/api/parsePath';
import { setCookie } from '@/lib/api/setCookie';
import { setSessionCookie } from '@/lib/api/sessionCookie';
import { db } from '@/lib/db/db';
import { NextApiRequest, NextApiResponse } from 'next';

const parseJsonResponse = async (response: Response) => {
  if (!response.ok) return null
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { code } = req.query
  const state = JSON.parse(req.query.state as string)
  const {baseUrl, route} = parsePath(state.origin)

  // get access token
  const tokenRes = await fetch('https://ion.tjhsst.edu/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'grant_type': 'authorization_code',
      'code': code as string,
      'client_id': process.env.ION_CLIENT_ID,
      'client_secret': process.env.ION_CLIENT_SECRET,
      'redirect_uri': `${baseUrl}/api/auth/ion/callback`
    })
  })
  const tokenBody = await parseJsonResponse(tokenRes)
  if (!tokenBody?.access_token) {
    res.redirect(302, baseUrl + '/')
    return
  }

  setCookie(res, 'auth', tokenBody, {
    secure: true,
    httpOnly: false,
    sameSite: 'none',
    path: '/',
  })

  // get profile
  const profileRes = await fetch('https://ion.tjhsst.edu/api/profile', {
    headers: {
      'Authorization': `Bearer ${tokenBody.access_token}`
    }
  })
  const profileBody = await parseJsonResponse(profileRes)
  if (!profileBody?.id) {
    res.redirect(302, baseUrl + '/')
    return
  }
  
  let user = await db.user.findFirst({
    where: {
      ionId: String(profileBody.id)
    }
  })

  if(user){
    setSessionCookie(res, {
      userId: user.id,
      ionId: String(profileBody.id),
      admin: user.admin,
      issuedAt: Date.now()
    })
    res.redirect(302, baseUrl + (route.startsWith('/404') ? '/' : route))
  } else {
    res.redirect(302, baseUrl + '/signup')
  }
}

export default handler;

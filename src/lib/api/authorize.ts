import { NextApiRequest, NextApiResponse } from 'next';
import {db} from '@/lib/db/db'
import { clearSessionCookie, readSessionCookie, setSessionCookie } from '@/lib/api/sessionCookie'

const parseJsonResponse = async (response: Response) => {
  if (!response.ok) return null
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

export const authorize = async (
  req: NextApiRequest,
  res: NextApiResponse,
  admin=false,
  options: { requireProfile?: boolean } = {}
) => {
  let authorization = null
  if(!authorization) authorization = req.headers.authorization
  if(!authorization && req.cookies.auth) {
    try {
      const auth = JSON.parse(req.cookies.auth)
      if(auth?.access_token) authorization = `Bearer ${auth.access_token}`
    } catch {
      authorization = null
    }
  }
  req.headers.authorization = authorization

  const session = readSessionCookie(req)
  if (session) {
    const user = await db.user.findFirst({
      where: {
        id: session.userId
      }
    })
    const sessionMatchesUser = Boolean(user && user.ionId === session.ionId)
    if (!sessionMatchesUser) {
      clearSessionCookie(res)
    }
    const authorized = Boolean(user && (!admin || user.admin))
    if (sessionMatchesUser && user && admin && !user.admin) {
      return {
        authorized: false,
        user,
        profileBody: null
      }
    }
    if (sessionMatchesUser && authorized && !options.requireProfile) {
      return {
        authorized,
        user,
        profileBody: null
      }
    }
  }

  if (!authorization) {
    return {
      authorized: false,
      user: null,
      profileBody: null
    }
  }
  
  const profileRes = await fetch('https://ion.tjhsst.edu/api/profile', {headers: {
    'Authorization': authorization
  }})
  const profileBody = await parseJsonResponse(profileRes)
  let authorized = Boolean(profileBody?.id)
  
  let user = await db.user.findFirst({
    where: {
      ionId: String(profileBody?.id)
    }
  })
  
  if(admin && authorized && !user.admin) authorized = false;

  if (authorized && user) {
    setSessionCookie(res, {
      userId: user.id,
      ionId: user.ionId,
      admin: user.admin,
      issuedAt: Date.now()
    })
  }
  
  return {
    authorized,
    user,
    profileBody
  }
}

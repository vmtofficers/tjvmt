import { NextApiRequest, NextApiResponse } from 'next';
import {db} from '@/lib/db/db'
import { readSessionCookie } from '@/lib/api/sessionCookie'

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
    const auth = JSON.parse(req.cookies.auth)
    if(auth) authorization = `Bearer ${auth.access_token}`
  }
  req.headers.authorization = authorization

  const session = readSessionCookie(req)
  if (session) {
    const user = await db.user.findFirst({
      where: {
        id: session.userId
      }
    })
    const authorized = Boolean(user && (!admin || user.admin))
    if (user && admin && !user.admin) {
      return {
        authorized: false,
        user,
        profileBody: null
      }
    }
    if (authorized && !options.requireProfile) {
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
  
  return {
    authorized,
    user,
    profileBody
  }
}

import { NextApiResponse } from 'next';
import { serialize, CookieSerializeOptions } from 'cookie';

export const setCookie = (
  res: NextApiResponse,
  name: string,
  value: unknown,
  options: CookieSerializeOptions = {}
) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
  if(typeof options.maxAge === 'number'){
    options.expires = new Date(Date.now() + options.maxAge*1000)
  }

  const serialized = serialize(name, stringValue, options)
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', serialized)
    return
  }
  const header = Array.isArray(existing) ? [...existing, serialized] : [existing.toString(), serialized]
  res.setHeader('Set-Cookie', header)
}

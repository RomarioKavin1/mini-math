import { Wallet } from 'ethers'
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import { SiweMessage } from 'siwe'

export async function main() {
  const DOMAIN = 'localhost:3000'

  const CHAIN_ID = Number(process.env.CHAIN_ID ?? 1)

  const wallet = Wallet.createRandom()

  const jar = new CookieJar()
  const client = wrapper(axios.create({ baseURL: `http://${DOMAIN}`, jar, withCredentials: true }))

  const {
    data: { nonce },
  } = await client.get<{ nonce: string }>('/siwe/nonce')

  const msg = new SiweMessage({
    domain: DOMAIN,
    address: wallet.address,
    uri: `http://${DOMAIN}`,
    version: '1',
    chainId: CHAIN_ID,
    nonce,
  })

  const cookies1 = await jar.getCookies(`http://${DOMAIN}`) // from tough-cookie
  console.log(cookies1)

  const prepared = msg.prepareMessage() // canonical EIP-4361 string

  const signature = await wallet.signMessage(prepared)

  console.log(JSON.stringify({ message: prepared, signature }, null, 4))
  const verify = await client.post('/siwe/verify', { message: prepared, signature })
  console.log('verify:', verify.data)
  console.log('me:', (await client.get('/me')).data)

  const cookies2 = await jar.getCookies(`http://${DOMAIN}`) // from tough-cookie
  console.log(cookies2)
  const sid = cookies2.find((c) => c.key === 'sid')?.value // cookie name must match your express-session name
  console.log('SID for Swagger (paste this in Authorize):', sid)

  console.log('logout:', (await client.post('/logout')).data)

  try {
    await client.get('/me')
    throw new Error('should not be accessible after logout')
  } catch {
    console.log('successfully failed after logout')
  }
}

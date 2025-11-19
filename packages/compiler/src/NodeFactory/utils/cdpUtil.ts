import { CdpClient } from '@coinbase/cdp-sdk'

export interface CdpAccountCreationParams {
  accountName: string
  cdpClient?: CdpClient
}

export interface CdpAccountResult {
  address: string
  name?: string
  createdAt: Date
}

export interface EIP712Domain {
  name: string
  chainId: number
  verifyingContract: string
  version?: string
  salt?: string
}

export interface EIP712Type {
  name: string
  type: string
}

export interface EIP712Types {
  [key: string]: EIP712Type[]
}

export interface CdpSignatureParams {
  accountName: string
  accountAddressParam?: string
  domain: EIP712Domain
  types: EIP712Types
  primaryType: string
  message: Record<string, any>
  cdpClient?: CdpClient
}

export interface CdpSignatureResult {
  signature: any // CDP SDK returns SignatureResult type
  address: string
  domain: EIP712Domain
  primaryType: string
  message: Record<string, any>
}

/**
 * Signs typed data using a CDP account
 * @param params - Signature parameters including account address, domain, types, and message
 * @returns Promise<CdpSignatureResult> - The signature and related data
 */
export async function signTypedDataWithCdp(
  params: CdpSignatureParams,
): Promise<CdpSignatureResult> {
  try {
    const { domain, types, primaryType, message, cdpClient } = params

    // Use cdpService to create or get account
    const { cdpService } = await import('../services/cdpService')
    const account = await cdpService.createOrGetAccount(params.accountName)
    // Always use the CDP account address for signing, not the master wallet address
    const accountAddress = account.address

    // Get the CDP client for signing
    const client = cdpService.getClient()

    // Sign the typed data
    const signature = await client.evm.signTypedData({
      address: accountAddress as `0x${string}`,
      domain: {
        name: domain.name,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract as `0x${string}`,
        ...(domain.version && { version: domain.version }),
        ...(domain.salt && { salt: domain.salt as `0x${string}` }),
      },
      types,
      primaryType,
      message,
    })

    console.log('Signed typed data for address:', accountAddress)

    return {
      signature,
      address: accountAddress,
      domain,
      primaryType,
      message,
    }
  } catch (error) {
    console.error('Error signing typed data with CDP:', error)
    throw new Error(
      `Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Helper function to create a standard EIP712 domain
 * @param params - Domain parameters
 * @returns EIP712Domain - Standardized domain object
 */
export function createEIP712Domain(params: {
  name: string
  chainId: number
  verifyingContract: string
  version?: string
  salt?: string
}): EIP712Domain {
  return {
    name: params.name,
    chainId: params.chainId,
    verifyingContract: params.verifyingContract,
    ...(params.version && { version: params.version }),
    ...(params.salt && { salt: params.salt }),
  }
}

/**
 * Helper function to create standard EIP712 types
 * @param types - Type definitions
 * @returns EIP712Types - Standardized types object
 */
export function createEIP712Types(types: EIP712Types): EIP712Types {
  return types
}

import { z } from 'zod'

export const CreateAccountSchema = z.object({
  accountName: z.string().describe('Name of the account to create or get'),
})

export const AccountResponseSchema = z
  .object({
    name: z.string(),
    address: z.string(),
    createdAt: z.string(),
  })
  .openapi('CdpAccount')

export const AccountCheckResponseSchema = z
  .object({
    success: z.boolean(),
    data: AccountResponseSchema.nullable(),
    exists: z.boolean(),
  })
  .openapi('AccountCheckResponse')

export const TokenBalancesQuerySchema = z.object({
  address: z.string().describe('Wallet address'),
  network: z.string().describe('Network name (e.g., base-sepolia)'),
  pageSize: z.number().optional().describe('Number of results per page'),
  pageToken: z.string().optional().describe('Token for pagination'),
})

export const TokenBalanceSchema = z
  .object({
    token: z.object({
      network: z.string(),
      symbol: z.string(),
      name: z.string(),
      contractAddress: z.string(),
    }),
    amount: z.object({
      amount: z.string(),
      decimals: z.number(),
    }),
  })
  .openapi('TokenBalance')

export const TokenBalancesResponseSchema = z
  .object({
    balances: z.array(TokenBalanceSchema),
    nextPageToken: z.string().optional(),
  })
  .openapi('TokenBalancesResponse')

export const FaucetRequestSchema = z.object({
  address: z.string().describe('Wallet address to fund'),
  network: z.string().default('base-sepolia').describe('Network name'),
  token: z.string().default('eth').describe('Token symbol'),
})

export const FaucetResponseSchema = z
  .object({
    transactionHash: z.string(),
    network: z.string(),
    token: z.string(),
    address: z.string(),
  })
  .openapi('FaucetResponse')

export const ExportAccountSchema = z.object({
  accountName: z.string().describe('Account name '),
})

export const ExportAccountResponseSchema = z
  .object({
    privateKey: z.string(),
  })
  .openapi('ExportAccountResponse')

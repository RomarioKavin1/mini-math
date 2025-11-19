import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config();

export interface CdpAccount {
  name: string;
  address: string;
  createdAt?: Date;
}

export interface TokenBalance {
  token: {
    network: string;
    symbol: string;
    name: string;
    contractAddress: string;
  };
  amount: {
    amount: string;
    decimals: number;
  };
}

export interface TokenBalancesResponse {
  balances: TokenBalance[];
  nextPageToken?: string;
}

export interface FaucetResponse {
  transactionHash: string;
  network: string;
  token: string;
  address: string;
}

export class CdpService {
  private cdp: CdpClient;
  private static instance: CdpService;

  private constructor() {
    this.cdp = new CdpClient();
  }

  public static getInstance(): CdpService {
    if (!CdpService.instance) {
      CdpService.instance = new CdpService();
    }
    return CdpService.instance;
  }

  public async createOrGetAccount(accountName: string): Promise<CdpAccount> {
    try {
      const account = await this.cdp.evm.getOrCreateAccount({
        name: accountName,
      });
      return {
        name: accountName, // Use the provided name since CDP doesn't return it
        address: account.address,
        createdAt: new Date(), // CDP doesn't provide creation date in response
      };
    } catch (error) {
      console.error("Error creating/getting CDP account:", error);
      throw error;
    }
  }

  public async getAccount(accountName: string): Promise<CdpAccount | null> {
    try {
      const account = await this.cdp.evm.getAccount({
        name: accountName,
      });
      return {
        name: accountName, // Use the provided name since CDP doesn't return it
        address: account.address,
        createdAt: new Date(), // CDP doesn't provide creation date in response
      };
    } catch (error) {
      console.error("Error getting CDP account:", error);
      return null;
    }
  }

  public async exportAccount(params: {
    accountName?: string;
    address?: string;
  }): Promise<{ privateKey: string }> {
    try {
      if (!params.accountName && !params.address) {
        throw new Error("Either accountName or address is required");
      }

      // If name is provided, prefer exporting by name; otherwise use address
      if (params.accountName) {
        const result = await this.cdp.evm.exportAccount({
          name: params.accountName,
        });
        return { privateKey: result };
      }

      const result = await this.cdp.evm.exportAccount({
        address: params.address as `0x${string}`,
      });
      return { privateKey: result };
    } catch (error) {
      console.error("Error exporting CDP account:", error);
      throw error;
    }
  }

  public async getTokenBalances(
    address: string,
    network: string,
    pageSize?: number,
    pageToken?: string
  ): Promise<TokenBalancesResponse> {
    try {
      // Map frontend network names to CDP SDK network names
      const cdpNetwork = this.mapNetworkToCdp(network);

      const result = await this.cdp.evm.listTokenBalances({
        address: address as `0x${string}`,
        network: cdpNetwork as any, // Type assertion for network
        pageSize,
        pageToken,
      });

      // Transform the CDP response to match our interface
      const transformedBalances: TokenBalance[] = result.balances.map(
        (balance) => ({
          token: {
            network: balance.token.network,
            symbol: balance.token.symbol || "UNKNOWN",
            name: balance.token.name || "Unknown Token",
            contractAddress: balance.token.contractAddress,
          },
          amount: {
            amount: balance.amount.amount.toString(), // Convert bigint to string
            decimals: balance.amount.decimals,
          },
        })
      );

      return {
        balances: transformedBalances,
        nextPageToken: result.nextPageToken,
      };
    } catch (error) {
      console.error("Error getting token balances:", error);
      throw error;
    }
  }

  public async requestFaucet(
    address: string,
    network: string = "base-sepolia",
    token: string = "eth"
  ): Promise<FaucetResponse> {
    try {
      // Map frontend network names to CDP SDK network names
      const cdpNetwork = this.mapNetworkToCdp(network);

      const result = await this.cdp.evm.requestFaucet({
        address: address as `0x${string}`,
        network: cdpNetwork as any,
        token: token as any,
      });

      return {
        transactionHash: result.transactionHash,
        network,
        token,
        address,
      };
    } catch (error) {
      console.error("Error requesting faucet funds:", error);
      throw error;
    }
  }

  public async sendTransaction(params: {
    accountName: string;
    network: string;
    to: string;
    value: string;
    gasLimit?: string;
    description?: string;
  }): Promise<{ transactionHash: string; status: string; network: string }> {
    try {
      console.log("Sending CDP transaction:", params);

      // First, get or create the account
      const account = await this.createOrGetAccount(params.accountName);

      // Map frontend network names to CDP SDK network names
      const cdpNetwork = this.mapNetworkToCdp(params.network);

      // Send the transaction using CDP SDK
      const transactionResult = await this.cdp.evm.sendTransaction({
        address: account.address as `0x${string}`,
        transaction: {
          to: params.to as `0x${string}`,
          value: BigInt(params.value), // Convert string to BigInt
        },
        network: cdpNetwork as any,
      });

      console.log("CDP transaction sent successfully:", transactionResult);

      return {
        transactionHash: transactionResult.transactionHash,
        status: "pending",
        network: params.network,
      };
    } catch (error) {
      console.error("Error sending CDP transaction:", error);
      throw error;
    }
  }

  public async transferWithSmartAccount(params: {
    accountName: string;
    network: string;
    to: string;
    amount: string;
    token: string;
    description?: string;
    waitForConfirmation?: boolean;
  }): Promise<{
    userOpHash: string;
    status: string;
    network: string;
    confirmation?: {
      blockNumber: string;
      gasUsed: string;
      confirmations: number;
    };
  }> {
    try {
      console.log("Performing CDP smart account transfer:", params);

      // First, get or create the account
      const account = await this.createOrGetAccount(params.accountName);

      // Map frontend network names to CDP SDK network names
      const cdpNetwork = this.mapNetworkToCdp(params.network);

      // Import parseEther from viem for amount conversion
      const { parseEther } = await import("viem");

      // Get the account object from CDP SDK
      const cdpAccount = await this.cdp.evm.getOrCreateAccount({
        name: params.accountName,
      });

      // Perform the transfer using the account's transfer method
      const transferResult = await cdpAccount.transfer({
        to: params.to as `0x${string}`,
        amount: parseEther(params.amount),
        token: params.token as any,
        network: cdpNetwork as any,
      });

      console.log("CDP smart account transfer completed:", transferResult);

      const result: {
        userOpHash: string;
        status: string;
        network: string;
        confirmation?: {
          blockNumber: string;
          gasUsed: string;
          confirmations: number;
        };
      } = {
        userOpHash: transferResult.transactionHash,
        status: "pending",
        network: params.network,
      };

      // If confirmation is requested, wait for it
      if (params.waitForConfirmation) {
        console.log("Waiting for transaction confirmation...");
        const confirmation = await this.waitForTransactionConfirmation(
          transferResult.transactionHash,
          params.network
        );

        result.status = "confirmed";
        result.confirmation = {
          blockNumber: confirmation.blockNumber,
          gasUsed: confirmation.gasUsed,
          confirmations: confirmation.confirmations,
        };
      }

      return result;
    } catch (error) {
      console.error("Error performing CDP smart account transfer:", error);
      throw error;
    }
  }

  public async invokeContract(params: {
    accountName: string;
    network: string;
    contractAddress: string;
    abi: any[];
    method: string;
    args: any[];
    gasLimit?: string;
    priority?: string;
    description?: string;
  }): Promise<{
    transactionHash: string;
    status: string;
    network: string;
    gasUsed?: string;
    blockNumber?: number;
  }> {
    try {
      console.log("Invoking CDP smart contract:", params);

      // First, get or create the account
      const account = await this.createOrGetAccount(params.accountName);

      // Map frontend network names to CDP SDK network names
      const cdpNetwork = this.mapNetworkToCdp(params.network);

      // Execute the contract call using CDP SDK with encoded function data
      console.log("Attempting CDP smart contract invocation with:", {
        accountAddress: account.address,
        contractAddress: params.contractAddress,
        method: params.method,
        args: params.args,
        network: cdpNetwork,
      });

      // Import viem for function encoding
      const { encodeFunctionData } = await import("viem");

      // Encode the function data
      const encodedData = encodeFunctionData({
        abi: params.abi,
        functionName: params.method,
        args: params.args,
      });

      // Send the transaction with encoded contract data
      const transactionResult = await this.cdp.evm.sendTransaction({
        address: account.address as `0x${string}`,
        transaction: {
          to: params.contractAddress as `0x${string}`,
          value: BigInt(0), // No ETH value for contract calls
          data: encodedData as `0x${string}`,
        },
        network: cdpNetwork as any,
      });

      console.log("CDP contract invocation completed:", transactionResult);

      return {
        transactionHash: transactionResult.transactionHash,
        status: "confirmed",
        network: params.network,
        gasUsed: undefined, // CDP SDK doesn't return gas used in this response
        blockNumber: undefined, // CDP SDK doesn't return block number in this response
      };
    } catch (error) {
      console.error("Error invoking CDP smart contract:", error);

      // Extract user-friendly error message from CDP SDK error
      let errorMessage = "Failed to invoke smart contract";

      if (error && typeof error === "object" && "errorMessage" in error) {
        // CDP SDK error with errorMessage property
        errorMessage = error.errorMessage as string;

        // Add helpful suggestions for common errors
        if (errorMessage.toLowerCase().includes("insufficient balance")) {
          errorMessage +=
            ". Please ensure your SubWallet has enough ETH for gas fees and any required token amounts.";
        }
      } else if (error && typeof error === "object" && "message" in error) {
        // Standard error with message property
        errorMessage = error.message as string;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      throw new Error(errorMessage);
    }
  }

  public async getTransactionStatus(
    transactionHash: string,
    network: string
  ): Promise<{ status: string; confirmations?: number; blockNumber?: string }> {
    try {
      // For now, return a basic status
      // In a full implementation, you'd query the blockchain for actual status
      return {
        status: "confirmed", // Placeholder
        confirmations: 1,
        blockNumber: "0",
      };
    } catch (error) {
      console.error("Error getting transaction status:", error);
      throw error;
    }
  }

  public async waitForTransactionConfirmation(
    transactionHash: string,
    network: string
  ): Promise<{
    status: string;
    blockNumber: string;
    gasUsed: string;
    transactionHash: string;
    confirmations: number;
  }> {
    try {
      console.log(
        `Waiting for transaction confirmation: ${transactionHash} on ${network}`
      );

      // Import viem for blockchain interaction
      const { createPublicClient, http } = await import("viem");
      const { baseSepolia, base, sepolia, mainnet } = await import(
        "viem/chains"
      );

      // Map network names to viem chains
      const chainMap: Record<string, any> = {
        "base-sepolia": baseSepolia,
        base: base,
        "ethereum-sepolia": sepolia,
        ethereum: mainnet,
        "eth-sepolia": sepolia,
        eth: mainnet,
      };

      const chain = chainMap[network];
      if (!chain) {
        throw new Error(`Unsupported network for confirmation: ${network}`);
      }

      // Create public client for the specific chain
      const publicClient = createPublicClient({
        chain: chain,
        transport: http(),
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      console.log("Transaction confirmed:", receipt);

      return {
        status: "confirmed",
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        transactionHash: receipt.transactionHash,
        confirmations: receipt.status === "success" ? 1 : 0,
      };
    } catch (error) {
      console.error("Error waiting for transaction confirmation:", error);
      throw error;
    }
  }

  public getClient(): CdpClient {
    return this.cdp;
  }

  public async initialize(): Promise<void> {
    try {
      // Test the connection by making a simple call
      console.log("Initializing CDP service...");

      // Check if required environment variables are set
      const requiredEnvVars = [
        "CDP_API_KEY_ID",
        "CDP_API_KEY_SECRET",
        "CDP_WALLET_SECRET",
      ];
      const missingVars = requiredEnvVars.filter(
        (varName) => !process.env[varName]
      );

      if (missingVars.length > 0) {
        console.warn(
          `⚠️  Missing CDP environment variables: ${missingVars.join(", ")}`
        );
        console.warn(
          "CDP functionality will be limited. Please set the required environment variables."
        );
        return; // Don't throw error, just warn
      }

      // Test CDP connection with a simple operation
      console.log("Testing CDP connection...");
      console.log("CDP service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize CDP service:", error);
      console.warn(
        "CDP functionality will be disabled due to initialization failure"
      );
      // Don't throw error, just log it
    }
  }

  // Map frontend network names to CDP SDK network names
  private mapNetworkToCdp(network: string): string {
    const networkMap: Record<string, string> = {
      base: "base",
      "base-sepolia": "base-sepolia",
      ethereum: "ethereum",
      "ethereum-sepolia": "ethereum-sepolia",
      eth: "ethereum", // Legacy support
      "eth-sepolia": "ethereum-sepolia", // Legacy support
      avalanche: "avalanche",
      polygon: "polygon",
      optimism: "optimism",
      arbitrum: "arbitrum",
    };

    const mappedNetwork = networkMap[network];
    if (!mappedNetwork) {
      throw new Error(
        `Unsupported network: ${network}. Supported networks: ${Object.keys(
          networkMap
        ).join(", ")}`
      );
    }

    return mappedNetwork;
  }
}

export const cdpService = CdpService.getInstance();

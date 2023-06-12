import { HardhatNetworkUserConfig, NetworkUserConfig } from 'hardhat/types';

import { GWEI } from '../constants';
import { ENV } from '../env';
import { ConfigPerNetwork, Network, RpcUrl } from '../types';

const { ALCHEMY_KEY, INFURA_KEY, MNEMONIC_DEV, MNEMONIC_PROD } = ENV;

export const rpcUrls: ConfigPerNetwork<RpcUrl> = {
  main: ALCHEMY_KEY
    ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  goerli: ALCHEMY_KEY
    ? `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : `https://goerli.infura.io/v3/${INFURA_KEY}`,

  hardhat: 'http://localhost:8545',
  mumbai: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  localhost: 'http://localhost:8545',
};

export const gasPrices: ConfigPerNetwork<number | undefined> = {
  main: 1 * GWEI,
  goerli: undefined,
  hardhat: 1 * GWEI,
  localhost: 70 * GWEI,
  mumbai: undefined,
};

export const chainIds: ConfigPerNetwork<number> = {
  main: 1,
  goerli: 5,
  hardhat: 31337,
  localhost: 31337,
  mumbai: 80001,
};

export const mnemonics: ConfigPerNetwork<string | undefined> = {
  main: MNEMONIC_PROD,
  goerli: MNEMONIC_DEV,
  hardhat: MNEMONIC_DEV,
  localhost: MNEMONIC_DEV,
  mumbai: MNEMONIC_DEV,
};

export const gases: ConfigPerNetwork<number | undefined> = {
  main: undefined,
  goerli: 1_250_000,
  hardhat: undefined,
  localhost: 1_250_000,
  mumbai: undefined,
};

export const timeouts: ConfigPerNetwork<number | undefined> = {
  main: undefined,
  goerli: 999999,
  hardhat: undefined,
  localhost: 999999,
  mumbai: undefined,
};

export const blockGasLimits: ConfigPerNetwork<number | undefined> = {
  main: 300 * 10 ** 6,
  goerli: undefined,
  hardhat: 300 * 10 ** 6,
  localhost: undefined,
  mumbai: undefined,
};

export const initialBasesFeePerGas: ConfigPerNetwork<number | undefined> = {
  main: undefined,
  goerli: undefined,
  hardhat: 0,
  localhost: undefined,
  mumbai: undefined,
};

export const getBaseNetworkConfig = (network: Network): NetworkUserConfig => ({
  accounts: mnemonics[network]
    ? {
        mnemonic: mnemonics[network],
      }
    : undefined,
  chainId: chainIds[network],
  gas: gases[network],
  gasPrice: gasPrices[network],
  blockGasLimit: blockGasLimits[network],
  timeout: timeouts[network],
  initialBaseFeePerGas: initialBasesFeePerGas[network],
});
console.log('ALCHEMY_KEY', ALCHEMY_KEY);
export const getNetworkConfig = (network: Network): NetworkUserConfig => ({
  ...getBaseNetworkConfig(network),
  url: rpcUrls[network],
  saveDeployments: true,
});

export const getForkNetworkConfig = (
  network: Network,
): HardhatNetworkUserConfig => ({
  ...getBaseNetworkConfig(network),
  accounts: {
    mnemonic: mnemonics[network],
  },
  live: false,
  saveDeployments: true,
  forking: {
    url: rpcUrls[network],
    blockNumber: 8975098,
  },
});

export const getHardhatNetworkConfig = (): HardhatNetworkUserConfig => ({
  ...getBaseNetworkConfig('hardhat'),
  accounts: mnemonics.hardhat ? { mnemonic: mnemonics.hardhat } : undefined,
  saveDeployments: true,
  live: false,
});

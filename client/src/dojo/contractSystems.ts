import { DojoProvider, KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";
import { Config } from "../../dojo.config.ts";
import { Account, UniversalDetails, cairo, shortString } from "starknet";

const NAMESPACE = "zkube";

export interface Signer {
  account: Account;
}

export interface Create extends Signer {
  name: string;
}

export interface Rename extends Signer {
  name: string;
}

export interface Start extends Signer {
  mode: number;
  price: bigint;
  x: bigint;
  y: bigint;
  c: bigint;
  s: bigint;
  sqrt_ratio_hint: bigint;
  seed: bigint;
  beta: bigint;
}

export interface Move extends Signer {
  row_index: number;
  start_index: number;
  final_index: number;
}

export interface Bonus extends Signer {
  bonus: number;
  row_index: number;
  block_index: number;
}

export interface ChestSponsor extends Signer {
  chest_id: number;
  amount: bigint;
}

export interface ChestClaim extends Signer {
  chest_id: number;
}

export interface UpdateFreeDailyCredits extends Signer {
  value: number;
}

export interface UpdateDailyModePrice extends Signer {
  value: bigint;
}

export interface UpdateNormalModePrice extends Signer {
  value: bigint;
}

export interface SetAdmin extends Signer {
  address: bigint;
}

export interface DeleteAdmin extends Signer {
  address: bigint;
}

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export const getContractByName = (manifest: any, name: string) => {
  const contract = manifest.contracts.find((contract: any) =>
    contract.name.includes("::" + name),
  );
  if (contract) {
    return contract.address;
  } else {
    return "";
  }
};

export async function setupWorld(provider: DojoProvider, config: Config) {
  const details: UniversalDetails | undefined = undefined; // { maxFee: 1e15 };

  function account() {
    const contract_name = "account";
    const contract = config.manifest.contracts.find((c: any) =>
      c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const create = async ({ account, name }: Create) => {
      try {
        const encoded_name = shortString.encodeShortString(name);
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "create",
            calldata: [encoded_name],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing create:", error);
        throw error;
      }
    };

    const rename = async ({ account, name }: Rename) => {
      try {
        const encoded_name = shortString.encodeShortString(name);
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "rename",
            calldata: [encoded_name],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing rename:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      create,
      rename,
    };
  }

  function play() {
    const contract_name = "play";
    const contract = config.manifest.contracts.find((c: any) =>
      c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const start = async ({
      account,
      mode,
      price,
      x,
      y,
      c,
      s,
      sqrt_ratio_hint,
      seed,
      beta,
    }: Start) => {
      const contract_address = contract.address;
      try {
        return await provider.execute(
          account,
          [
            {
              contractAddress: KATANA_ETH_CONTRACT_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_address, cairo.uint256(price)], // Set allowance
            },
            {
              contractName: contract_name,
              entrypoint: "create",
              calldata: [mode, x, y, c, s, sqrt_ratio_hint, seed, beta],
            },
            {
              contractAddress: KATANA_ETH_CONTRACT_ADDRESS,
              entrypoint: "approve",
              calldata: [contract_address, cairo.uint256(0)], // Clear allowance
            },
          ],
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing start:", error);
        throw error;
      }
    };

    const surrender = async ({ account }: Signer) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "surrender",
            calldata: [],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing surrender:", error);
        throw error;
      }
    };

    const move = async ({
      account,
      row_index,
      start_index,
      final_index,
    }: Move) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "move",
            calldata: [row_index, start_index, final_index],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing move:", error);
        throw error;
      }
    };

    const bonus = async ({ account, bonus, row_index, block_index }: Bonus) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "apply_bonus",
            calldata: [bonus, row_index, block_index],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing bonus:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      start,
      surrender,
      move,
      bonus,
    };
  }

  function chest() {
    const contract_name = "chest";
    const contract = config.manifest.contracts.find((c: any) =>
      c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const claim = async ({ account, chest_id }: ChestClaim) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "claim",
            calldata: [chest_id],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing claim:", error);
        throw error;
      }
    };

    const sponsor = async ({ account, chest_id, amount }: ChestSponsor) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "sponsor",
            calldata: [chest_id, amount],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing sponsor:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      claim,
      sponsor,
    };
  }

  function settings() {
    const contract_name = "settings";
    const contract = config.manifest.contracts.find((c: any) =>
      c.tag.includes(contract_name),
    );
    if (!contract) {
      throw new Error(`Contract ${contract_name} not found in manifest`);
    }

    const update_free_daily_credits = async ({
      account,
      value,
    }: UpdateFreeDailyCredits) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "update_free_daily_credits",
            calldata: [value],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing update_free_daily_credits:", error);
        throw error;
      }
    };

    const update_daily_mode_price = async ({
      account,
      value,
    }: UpdateDailyModePrice) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "update_daily_mode_price",
            calldata: [value],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing update_daily_mode_price:", error);
        throw error;
      }
    };

    const update_normal_mode_price = async ({
      account,
      value,
    }: UpdateNormalModePrice) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "update_normal_mode_price",
            calldata: [value],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing update_normal_mode_price:", error);
        throw error;
      }
    };

    const set_admin = async ({ account, address }: SetAdmin) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "set_admin",
            calldata: [address],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing set_admin:", error);
        throw error;
      }
    };

    const delete_admin = async ({ account, address }: DeleteAdmin) => {
      try {
        return await provider.execute(
          account,
          {
            contractName: contract_name,
            entrypoint: "delete_admin",
            calldata: [address],
          },
          NAMESPACE,
          details,
        );
      } catch (error) {
        console.error("Error executing delete_admin:", error);
        throw error;
      }
    };

    return {
      address: contract.address,
      update_free_daily_credits,
      update_daily_mode_price,
      update_normal_mode_price,
      set_admin,
      delete_admin,
    };
  }

  return {
    account: account(),
    play: play(),
    chest: chest(),
    settings: settings(),
  };
}

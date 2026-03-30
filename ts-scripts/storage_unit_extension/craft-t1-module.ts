import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
import { MODULE } from "./modules";
import { resolveStorageUnitExtensionIdsFromEnv } from "./extension-ids";
import { getCharacterOwnerCap } from "../helpers/character";
import { CLOCK_OBJECT_ID } from "../utils/constants";
import { MODULES } from "../utils/config";

async function main() {
    console.log("============= Craft T1 Module (On-chain) ==============\n");

    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        const { client, keypair, config, address } = ctx;
        await hydrateWorldConfig(ctx);

        const { builderPackageId, extensionConfigId } =
            resolveStorageUnitExtensionIdsFromEnv();

        const characterId = requireEnv("CHARACTER_ID");
        const storageUnitId = requireEnv("STORAGE_UNIT_ID");

        const playerOwnerCapId = await getCharacterOwnerCap(
            characterId,
            client,
            config,
            address
        );
        if (!playerOwnerCapId) {
            throw new Error(`OwnerCap not found for ${characterId}`);
        }

        const tx = new Transaction();

        const [ownerCap, returnReceipt] = tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::borrow_owner_cap`,
            typeArguments: [`${config.packageId}::${MODULES.CHARACTER}::Character`],
            arguments: [tx.object(characterId), tx.object(playerOwnerCapId)],
        });

        tx.moveCall({
            target: `${builderPackageId}::${MODULE.T1_MODULE_CRAFTING}::craft_t1_from_storage`,
            typeArguments: [`${config.packageId}::${MODULES.CHARACTER}::Character`],
            arguments: [
                tx.object(extensionConfigId),
                tx.object(storageUnitId),
                tx.object(characterId),
                ownerCap,
                tx.object(CLOCK_OBJECT_ID),
            ],
        });

        tx.moveCall({
            target: `${config.packageId}::${MODULES.CHARACTER}::return_owner_cap`,
            typeArguments: [`${config.packageId}::${MODULES.CHARACTER}::Character`],
            arguments: [tx.object(characterId), ownerCap, returnReceipt],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showEffects: true, showObjectChanges: true, showEvents: true },
        });

        console.log("T1 module crafted on-chain");
        console.log("Transaction digest:", result.digest);
    } catch (error) {
        handleError(error);
    }
}

main();

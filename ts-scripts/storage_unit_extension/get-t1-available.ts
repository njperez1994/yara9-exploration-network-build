import "dotenv/config";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
import { devInspectMoveCallFirstReturnValueBytes } from "../utils/dev-inspect";
import { resolveStorageUnitExtensionIdsFromEnv } from "./extension-ids";
import { MODULE } from "./modules";

function parseU64LE(bytes: Uint8Array): bigint {
    if (bytes.length < 8) {
        throw new Error(`Expected 8 bytes for u64, got ${bytes.length}`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getBigUint64(0, true);
}

async function main() {
    console.log("============= Read T1 Module Availability ==============\n");

    try {
        const env = getEnvConfig();
        const ctx = initializeContext(env.network, env.adminExportedKey);
        const { client } = ctx;
        await hydrateWorldConfig(ctx);

        const { builderPackageId, extensionConfigId } =
            resolveStorageUnitExtensionIdsFromEnv();
        const storageUnitId = requireEnv("STORAGE_UNIT_ID");
        const senderAddress = process.env.ADMIN_ADDRESS;

        const bytes = await devInspectMoveCallFirstReturnValueBytes(client, {
            target: `${builderPackageId}::${MODULE.T1_MODULE_CRAFTING}::t1_available`,
            senderAddress,
            arguments: (tx) => [tx.object(extensionConfigId), tx.object(storageUnitId)],
        });

        if (!bytes) {
            throw new Error("No value returned from t1_available");
        }

        const available = Number(parseU64LE(bytes));
        console.log(`Storage ${storageUnitId} -> T1 modules available: ${available}`);
    } catch (error) {
        handleError(error);
    }
}

main();

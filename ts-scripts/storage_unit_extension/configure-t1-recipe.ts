import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
} from "../utils/helper";
import { resolveStorageUnitExtensionIds } from "./extension-ids";
import { MODULE } from "./modules";

const DEFAULT_FELDSPAR_TYPE_ID = BigInt(77800);
const DEFAULT_FELDSPAR_QTY = 100;
const DEFAULT_PLATINUM_TYPE_ID = BigInt(77810);
const DEFAULT_PLATINUM_QTY = 25;

async function main() {
    console.log("============= Configure T1 Recipe ==============\n");

    try {
        const env = getEnvConfig();
        const ctx = initializeContext(env.network, env.adminExportedKey);
        const { client, keypair, address } = ctx;
        await hydrateWorldConfig(ctx);

        const { builderPackageId, adminCapId, extensionConfigId } =
            await resolveStorageUnitExtensionIds(client, address);

        const felsparTypeId = BigInt(process.env.T1_FELDSPAR_TYPE_ID || DEFAULT_FELDSPAR_TYPE_ID);
        const felsparQty = Number(process.env.T1_FELDSPAR_QTY || DEFAULT_FELDSPAR_QTY);
        const platinumTypeId = BigInt(
            process.env.T1_PLATINUM_TYPE_ID || DEFAULT_PLATINUM_TYPE_ID
        );
        const platinumQty = Number(process.env.T1_PLATINUM_QTY || DEFAULT_PLATINUM_QTY);

        const tx = new Transaction();
        tx.moveCall({
            target: `${builderPackageId}::${MODULE.T1_MODULE_CRAFTING}::set_t1_recipe`,
            arguments: [
                tx.object(extensionConfigId),
                tx.object(adminCapId),
                tx.pure.u64(felsparTypeId),
                tx.pure.u32(felsparQty),
                tx.pure.u64(platinumTypeId),
                tx.pure.u32(platinumQty),
            ],
        });

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: { showEffects: true, showObjectChanges: true },
        });

        console.log("T1 recipe configured");
        console.log(
            `Recipe: Feldspar(${felsparTypeId}) x${felsparQty}, Platinum(${platinumTypeId}) x${platinumQty}`
        );
        console.log("Transaction digest:", result.digest);
    } catch (error) {
        handleError(error);
    }
}

main();

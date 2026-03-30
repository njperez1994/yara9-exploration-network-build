import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { requireEnv } from "../utils/helper";
import { MODULE } from "./modules";

export type StorageUnitExtensionIds = {
    builderPackageId: string;
    adminCapId: string;
    extensionConfigId: string;
};

export function requireBuilderPackageId(): string {
    return requireEnv("BUILDER_PACKAGE_ID");
}

export function resolveStorageUnitExtensionIdsFromEnv(): {
    builderPackageId: string;
    extensionConfigId: string;
} {
    return {
        builderPackageId: requireBuilderPackageId(),
        extensionConfigId: requireEnv("EXTENSION_CONFIG_ID"),
    };
}

export async function resolveStorageUnitExtensionIds(
    client: SuiJsonRpcClient,
    ownerAddress: string
): Promise<StorageUnitExtensionIds> {
    const { builderPackageId, extensionConfigId } = resolveStorageUnitExtensionIdsFromEnv();
    const adminCapType = `${builderPackageId}::${MODULE.CONFIG}::AdminCap`;

    const result = await client.getOwnedObjects({
        owner: ownerAddress,
        filter: { StructType: adminCapType },
        limit: 1,
    });

    const adminCapId = result.data[0]?.data?.objectId;
    if (!adminCapId) {
        throw new Error(
            `AdminCap not found for ${ownerAddress}. ` +
                `Make sure this address published the storage_unit_extension package.`
        );
    }

    return { builderPackageId, adminCapId, extensionConfigId };
}

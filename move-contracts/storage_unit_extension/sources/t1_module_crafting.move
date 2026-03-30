module storage_unit_extension::t1_module_crafting;

use storage_unit_extension::config::{Self, AdminCap, ExtensionConfig, XAuth};
use sui::{clock::Clock, event};
use world::{
    access::OwnerCap,
    character::Character,
    storage_unit::StorageUnit,
};

#[error(code = 0)]
const ENoRecipeConfig: vector<u8> = b"Missing T1 recipe config";
#[error(code = 1)]
const EFelsparTypeMismatch: vector<u8> = b"Unexpected type for Feldspar input";
#[error(code = 2)]
const EPlatinumTypeMismatch: vector<u8> = b"Unexpected type for Platinum input";
#[error(code = 3)]
const EInvalidRecipe: vector<u8> = b"Recipe values must be non-zero";
#[error(code = 4)]
const ENoModuleLedger: vector<u8> = b"No module ledger for storage unit";
#[error(code = 5)]
const ENoModulesAvailable: vector<u8> = b"No T1 modules available to consume";

public struct T1RecipeConfig has store, drop {
    felspar_type_id: u64,
    felspar_qty: u32,
    platinum_type_id: u64,
    platinum_qty: u32,
}

public struct T1RecipeConfigKey has copy, drop, store {}

public struct T1ModuleLedger has store, drop {
    t1_available: u64,
    total_crafted: u64,
    last_crafted_at_ms: u64,
}

public struct T1ModuleLedgerKey has copy, drop, store {
    storage_unit_id: ID,
}

public struct T1ModuleCraftedEvent has copy, drop {
    player: address,
    storage_unit_id: ID,
    t1_available: u64,
    total_crafted: u64,
    crafted_at_ms: u64,
}

public struct T1ModuleConsumedEvent has copy, drop {
    player: address,
    storage_unit_id: ID,
    remaining: u64,
}

public fun set_t1_recipe(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    felspar_type_id: u64,
    felspar_qty: u32,
    platinum_type_id: u64,
    platinum_qty: u32,
) {
    assert!(felspar_type_id != 0, EInvalidRecipe);
    assert!(platinum_type_id != 0, EInvalidRecipe);
    assert!(felspar_qty > 0, EInvalidRecipe);
    assert!(platinum_qty > 0, EInvalidRecipe);

    extension_config.set_rule<T1RecipeConfigKey, T1RecipeConfig>(
        admin_cap,
        T1RecipeConfigKey {},
        T1RecipeConfig {
            felspar_type_id,
            felspar_qty,
            platinum_type_id,
            platinum_qty,
        },
    );
}

/// Craft one T1 module by consuming real resources from owner inventory.
///
/// Consumed materials are deposited into extension-controlled open inventory,
/// effectively removing them from owner-accessed inventory.
public fun craft_t1_from_storage<T: key>(
    extension_config: &mut ExtensionConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    player_inventory_owner_cap: &OwnerCap<T>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(extension_config.has_rule<T1RecipeConfigKey>(T1RecipeConfigKey {}), ENoRecipeConfig);
    let recipe = extension_config.borrow_rule<T1RecipeConfigKey, T1RecipeConfig>(T1RecipeConfigKey {});

    let felspar_item = storage_unit.withdraw_by_owner<T>(
        character,
        player_inventory_owner_cap,
        recipe.felspar_type_id,
        recipe.felspar_qty,
        ctx,
    );
    assert!(felspar_item.type_id() == recipe.felspar_type_id, EFelsparTypeMismatch);
    storage_unit.deposit_to_open_inventory<XAuth>(
        character,
        felspar_item,
        config::x_auth(),
        ctx,
    );

    let platinum_item = storage_unit.withdraw_by_owner<T>(
        character,
        player_inventory_owner_cap,
        recipe.platinum_type_id,
        recipe.platinum_qty,
        ctx,
    );
    assert!(platinum_item.type_id() == recipe.platinum_type_id, EPlatinumTypeMismatch);
    storage_unit.deposit_to_open_inventory<XAuth>(
        character,
        platinum_item,
        config::x_auth(),
        ctx,
    );

    let player = ctx.sender();
    let storage_unit_id = object::id(storage_unit);
    let key = T1ModuleLedgerKey { storage_unit_id };
    if (!extension_config.has_rule<T1ModuleLedgerKey>(copy key)) {
        extension_config.add_rule<T1ModuleLedgerKey, T1ModuleLedger>(
            copy key,
            T1ModuleLedger {
                t1_available: 0,
                total_crafted: 0,
                last_crafted_at_ms: 0,
            },
        );
    };

    let ledger = extension_config.borrow_rule_mut<T1ModuleLedgerKey, T1ModuleLedger>(key);
    ledger.t1_available = ledger.t1_available + 1;
    ledger.total_crafted = ledger.total_crafted + 1;
    ledger.last_crafted_at_ms = clock.timestamp_ms();

    event::emit(T1ModuleCraftedEvent {
        player,
        storage_unit_id,
        t1_available: ledger.t1_available,
        total_crafted: ledger.total_crafted,
        crafted_at_ms: ledger.last_crafted_at_ms,
    });
}

public fun consume_t1_module_for_scan(
    extension_config: &mut ExtensionConfig,
    storage_unit: &StorageUnit,
    player: address,
) {
    let storage_unit_id = object::id(storage_unit);
    let key = T1ModuleLedgerKey { storage_unit_id };
    assert!(extension_config.has_rule<T1ModuleLedgerKey>(copy key), ENoModuleLedger);
    let ledger = config::borrow_rule_mut<T1ModuleLedgerKey, T1ModuleLedger>(extension_config, key);
    assert!(ledger.t1_available > 0, ENoModulesAvailable);
    ledger.t1_available = ledger.t1_available - 1;

    event::emit(T1ModuleConsumedEvent {
        player,
        storage_unit_id,
        remaining: ledger.t1_available,
    });
}

public fun t1_available(extension_config: &ExtensionConfig, storage_unit: &StorageUnit): u64 {
    let key = T1ModuleLedgerKey {
        storage_unit_id: object::id(storage_unit),
    };
    if (!extension_config.has_rule<T1ModuleLedgerKey>(copy key)) {
        return 0;
    };
    extension_config.borrow_rule<T1ModuleLedgerKey, T1ModuleLedger>(key).t1_available
}

public fun recipe_felspar_type_id(extension_config: &ExtensionConfig): u64 {
    extension_config.borrow_rule<T1RecipeConfigKey, T1RecipeConfig>(T1RecipeConfigKey {}).felspar_type_id
}

public fun recipe_platinum_type_id(extension_config: &ExtensionConfig): u64 {
    extension_config.borrow_rule<T1RecipeConfigKey, T1RecipeConfig>(T1RecipeConfigKey {}).platinum_type_id
}

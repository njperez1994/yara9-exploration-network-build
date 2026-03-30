# Storage Unit Extension (T1 Crafting)

This folder wires real on-chain T1 crafting against a Smart Storage Unit.

## Required env

- `WORLD_PACKAGE_ID`
- `BUILDER_PACKAGE_ID` (published `storage_unit_extension` package)
- `EXTENSION_CONFIG_ID` (shared object from package init)
- `ADMIN_PRIVATE_KEY`
- `PLAYER_A_PRIVATE_KEY`
- `CHARACTER_ID`
- `STORAGE_UNIT_ID`

## Flow

1. Authorize extension witness on storage unit:

```bash
pnpm authorise-storage-unit-extension-t1
```

2. Configure recipe (defaults 77800x100 + 77810x25):

```bash
pnpm configure-t1-recipe
```

3. Craft one T1 module by consuming real storage resources:

```bash
pnpm craft-t1-module
```

4. Read persistent module availability:

```bash
pnpm get-t1-available
```

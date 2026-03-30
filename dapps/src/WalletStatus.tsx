import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { AssemblyInfo } from "./AssemblyInfo";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

export function WalletStatus() {
  const account = useCurrentAccount();
  const itemId = import.meta.env.VITE_ITEM_ID;

  return (
    <Container className="wallet-status" my="2">
      {account ? (
        <Flex direction="column" gap="2">
          <Text className="status-chip success">Wallet connected</Text>
          <Box className="mono-block">{account.address}</Box>
        </Flex>
      ) : (
        <Text className="status-chip">Wallet not connected</Text>
      )}

      <div className="divider" />

      {itemId ? (
        <AssemblyInfo />
      ) : (
        <Text className="helper-note">
          Smart Object panel hidden: set <code>VITE_ITEM_ID</code> to load an
          assembly.
        </Text>
      )}
    </Container>
  );
}

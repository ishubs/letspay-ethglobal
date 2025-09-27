import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LetsPaySelfAttestModule", (m) => {
  // Self Protocol V2 Hub address for Celo Testnet
  const SELF_HUB_TESTNET = "0x68c931C9a534D37aa78094877F46fE46a49F1A51";
  const INITIAL_SCOPE = 1;

  const letspaySelfAttest = m.contract("LetsPaySelfAttest", [
    SELF_HUB_TESTNET,
    INITIAL_SCOPE
  ]);

  return { letspaySelfAttest };
});
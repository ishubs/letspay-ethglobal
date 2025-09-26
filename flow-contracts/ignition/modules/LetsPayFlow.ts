import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LetsPayFlowModule", (m) => {
  const letsPayFlow = m.contract("LetsPayFlow");

  return { letsPayFlow };
});
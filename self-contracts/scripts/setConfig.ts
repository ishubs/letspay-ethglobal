import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "selfTestnet",
  chainType: "l1",
});
async function main() {
  const contractAddress = process.env.SELF_CONTRACT_ADDRESS;
  const configId = process.env.SELF_CONFIG_ID;
  const scope = process.env.SELF_SCOPE;

    
  if (!contractAddress || !configId || !scope) {
    throw new Error("SELF_CONTRACT_ADDRESS, SELF_CONFIG_ID, and SELF_SCOPE environment variables are not set.");
  }

  const [deployer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("LetsPaySelfAttest", contractAddress, deployer);
  
  

  console.log(deployer)
  console.log("Setting config ID...");
  console.log(contract)
  let tx = await contract.setConfigId(configId);
  await tx.wait();
  console.log("✅ Config ID set");

  console.log("Setting scope...");
  tx = await contract.setScope(scope);
  await tx.wait();
  console.log("✅ Scope set");

  console.log("🎉 Contract configuration complete!");
}

main().catch(console.error);

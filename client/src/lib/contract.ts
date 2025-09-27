import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_FLOW_CONTRACT_ADDRESS

export const CONTRACT_ABI = [
  "function signup() external",
  "function createEscrow(address merchant, address[] participants, uint256[] shares, uint256 total) external returns (uint256)",
  "function accept(uint256 escrowId) external",
  "function getPendingEscrowsFor(address user) external view returns (uint256[])",
  "function escrowDetails(uint256 escrowId) external view returns (address host, address merchant, uint256 total, uint8 status, address[] participants, uint256[] shares)",
  "function credit(address user) external view returns (uint256)",
  "function signedUp(address user) external view returns (bool)",
  "function repayCredit() external payable"
] as const;

export function getContractInstance(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}



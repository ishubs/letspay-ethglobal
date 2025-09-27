
import React, { useState } from "react";
import { ethers, type EventLog } from "ethers";
// import { SiweMessage } from "siwe"; // no longer used
import SelfVerification from "./components/SelfVerification";

// Self attestation contract (Celo Alfajores)
const SELF_ATTEST_ADDRESS = "0x62eb4ff58aA643BE97075D523934ef10A50678aE";
const SELF_ATTEST_ABI = [
  "event UserVerified(address indexed user, bytes32 indexed userIdentifier, string nationality, uint256 timestamp)",
] as const;

const SelfVerify: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [verificationData, setVerificationData] = useState<unknown>(null);
  const [showRealSelfVerification, setShowRealSelfVerification] = useState(false);

  // 1. Connect Celo wallet (Alfajores)
  async function connectWallet() {
    if (!(window as unknown as { ethereum?: unknown }).ethereum) {
      alert("Please install MetaMask or a Celo-compatible wallet.");
      return;
    }
    const provider = new ethers.BrowserProvider((window as unknown as { ethereum?: unknown }).ethereum as ethers.Eip1193Provider);
    const accounts = await provider.send("eth_requestAccounts", []);
    setWalletAddress(accounts[0]);
  }

  // 2. Deprecated mock/legacy backend flow — removed
  async function requestSelfProof() {
    alert("Legacy mock flow removed. Use Real Self Verification below.");
  }

  const handleVerificationSuccess = async (data: unknown) => {
    try {
      console.log("Self verification successful:", data);
      setVerificationData(data);

      if (!walletAddress) {
        setStatus("❌ Wallet not connected. Connect and try again.");
        return;
      }

      // Listen for on-chain event from LetsPaySelfAttest and surface tx hash
      const provider = new ethers.BrowserProvider((window as unknown as { ethereum?: unknown }).ethereum as ethers.Eip1193Provider);
      const contract = new ethers.Contract(SELF_ATTEST_ADDRESS, SELF_ATTEST_ABI, provider);

      // Query recent history in case event already mined
      try {
        const current = await provider.getBlockNumber();
        const fromBlock = current > 5000 ? current - 5000 : 0;
        const filter = contract.filters.UserVerified();
        const logs = (await contract.queryFilter(filter, fromBlock, current)) as EventLog[];
        console.log("logs:", logs);
        if (logs.length > 0) {
          const last: EventLog = logs[logs.length - 1];
          const txHash = last.transactionHash;
          setStatus(`✅ Verified on-chain! Tx: ${txHash}`);
          return;

        }

      } catch {
        // best effort; fall through to live listener
      }

      // Fallback: wait for the next event
      const filter = contract.filters.UserVerified(walletAddress);
      setStatus("⏳ Waiting for on-chain confirmation...");
      contract.once(filter, (...args: unknown[]) => {
        const ev = args[args.length - 1] as EventLog;
        const txHash = ev.transactionHash;
        setStatus(`✅ Verified on-chain! Tx: ${txHash}`);
      });
    } catch (err: unknown) {
      console.error("Error handling verification success:", err);
      const message = err instanceof Error ? err.message : String(err);
      setStatus(`❌ Error: ${message}`);
    }
  };

  const handleVerificationError = (error: string) => {
    console.error("Self verification failed:", error);
    setStatus(`❌ Self verification failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Self Verification Test Suite
        </h1>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Wallet Connection</h2>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>

        {/* Test Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mock Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">2. Mock Verification Test (removed)</h2>
            <p className="text-gray-600 mb-4">Legacy backend mock removed. Use Real Self Verification.</p>
            <button
              onClick={requestSelfProof}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
            >
              Test Mock Verification
            </button>
            {status && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">{status}</p>
              </div>
            )}
          </div>

          {/* Real Self Verification */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">3. Real Self Verification</h2>
            <p className="text-gray-600 mb-4">
              Test with actual Self Protocol integration (requires Self mobile app).
            </p>
            <button
              onClick={() => setShowRealSelfVerification(!showRealSelfVerification)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              {showRealSelfVerification ? "Hide" : "Show"} Real Self Verification
            </button>
            
            {showRealSelfVerification && (
              <div className="mt-4">
                <SelfVerification
                  onVerificationSuccess={handleVerificationSuccess}
                  onVerificationError={handleVerificationError}
                  walletAddress={walletAddress}
                />
              </div>
            )}
          </div>
        </div>

        {/* Verification Results */}
        {verificationData !== null && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Verification Results</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(verificationData, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Connect your wallet first</li>
            <li>Try the "Mock Verification Test" to test backend integration</li>
            <li>For real testing, use "Real Self Verification" and scan the QR code with the Self mobile app</li>
            <li>Check the browser console for detailed debug information</li>
            <li>Ensure your backend server is running on port 4000</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SelfVerify;

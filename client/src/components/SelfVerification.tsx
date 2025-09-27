import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfAppBuilder,
  type SelfApp,
  SelfQRcode,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface SelfVerificationProps {
  onVerificationSuccess: (data: unknown) => void;
  onVerificationError: (error: string) => void;
  walletAddress?: string;
}

const SelfVerification: React.FC<SelfVerificationProps> = ({
  onVerificationSuccess,
  onVerificationError,
  walletAddress
}) => {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSelfApp = async () => {
      try {
        setIsLoading(true);
        

        const userId = walletAddress ? walletAddress : ethers.ZeroAddress;

        const app = new SelfAppBuilder({
          version: 2,
          appName: "LetsPay",
          scope: "letspay-self-attest", 
          devMode: true,
          chainID: 11142220,
          // Use staging hub; no custom backend
          endpoint: import.meta.env.VITE_SELF_CONTRACT_ADDRESS,
          logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
          userId: userId,
     
          endpointType: "staging_celo",
          userIdType: "hex",
          userDefinedData: "LetsPay Identity Verification",
          disclosures: {

            minimumAge: 18,
            ofac: true,
            excludedCountries: [],

            // Disclosure requests (what users reveal)
            // nationality: true,
            // gender: true,
            // name: false,
            // date_of_birth: true,
            // passport_number: false,
            // expiry_date: false,
          }
        }).build();

        setSelfApp(app);
        setUniversalLink(getUniversalLink(app));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
        onVerificationError("Failed to initialize Self verification");
        setIsLoading(false);
      }
    };

    initializeSelfApp();
  }, [walletAddress, onVerificationError]);

  const handleSuccessfulVerification = () => {
    console.log("Self verification successful");
    onVerificationSuccess(
      { verified: true }
    );
  };

  const handleVerificationError = (err: unknown) => {
    console.error("Self verification failed", err);
    const message = typeof err === 'string' ? err : 'Identity verification failed. Please try again.';
    onVerificationError(message);
  };

  const openSelfApp = () => {
    if (universalLink) {
      window.open(universalLink, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Initializing Self verification...</p>
      </div>
    );
  }

  if (!selfApp) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 mb-4">❌</div>
        <p className="text-red-600">Failed to initialize Self verification</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
        <p className="text-gray-600 mb-4">
          Scan the QR code with the Self app to verify your identity
        </p>
      </div>

      {/* QR Code for desktop/cross-device */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <SelfQRcode
          selfApp={selfApp}
          
          onSuccess={handleSuccessfulVerification}
          onError={handleVerificationError}
        />
      </div>

      {universalLink && (
        <div className="w-full max-w-sm">
          <button
            onClick={openSelfApp}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📱 Open Self App
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Tap to open Self app directly on mobile
          </p>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 max-w-md">
        <p>
          <strong>What you'll verify:</strong> Age 18+, nationality, and gender.
          <br />
          Your personal data stays private and secure.
        </p>
      </div>
    </div>
  );
};

export default SelfVerification;

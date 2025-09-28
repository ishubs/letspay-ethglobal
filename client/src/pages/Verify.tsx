import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SelfVerification from "../components/SelfVerification";
import { useLetsPay } from "../lib/useLetsPay";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const navigate = useNavigate();
  const { account, loadVerificationStatus, markVerified } = useLetsPay();

  const handleSuccess = useCallback(async () => {
    // Optimistically mark verified for this session and persist to localStorage
    // so the home page stops prompting immediately.
    markVerified();
    // Also attempt to refresh from backend in the background.
    await loadVerificationStatus();
    navigate("/");
  }, [markVerified, loadVerificationStatus, navigate]);

  const handleError = useCallback(() => {
    // non-blocking; user can retry
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-3xl mx-auto sm:px-6 lg:px-8 ">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full">
          <p className="text-gray-600 mb-6 text-center">
            Complete a quick KYC check to unlock your LetsPay credit and start transacting.
          </p>
          <SelfVerification
            onVerificationSuccess={handleSuccess}
            onVerificationError={handleError}
            walletAddress={account}
          />
          <div className="mt-6 flex justify-center">
            <div className="flex gap-3">
              <Button variant="outline" className="!text-white" onClick={() => navigate("/")}>Back to Home</Button>
              {/* <Button onClick={() => { markVerified(); navigate("/"); }}>Skip for now</Button> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



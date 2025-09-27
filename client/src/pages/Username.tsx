import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLetsPay } from "../lib/useLetsPay";
import { Button } from "@/components/ui/button";

export default function Username() {
  const navigate = useNavigate();
  const { account, checkEnsAvailability, registerEns } = useLetsPay();

  const [label, setLabel] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const normalizedLabel = useMemo(() => label.trim().toLowerCase(), [label]);

  const validate = useCallback(() => {
    if (!normalizedLabel) return "Please enter a username";
    if (!/^[a-z0-9-]{3,50}$/.test(normalizedLabel)) {
      return "Only a-z, 0-9, '-' allowed; min 3 chars";
    }
    if (normalizedLabel.startsWith("-") || normalizedLabel.endsWith("-")) {
      return "Username cannot start or end with '-'";
    }
    return "";
  }, [normalizedLabel]);

  const onCheck = useCallback(async () => {
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      setIsAvailable(null);
      return;
    }
    setIsBusy(true);
    try {
      const ok = await checkEnsAvailability(normalizedLabel);
      setIsAvailable(ok);
      if (!ok) setError("That username is taken");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setIsAvailable(null);
    } finally {
      setIsBusy(false);
    }
  }, [checkEnsAvailability, normalizedLabel, validate]);

  const onRegister = useCallback(async () => {
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setIsBusy(true);
    try {
      const res = await registerEns(normalizedLabel);
      if (res?.success) {
        setIsRegistered(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsBusy(false);
    }
  }, [registerEns, normalizedLabel, validate]);

  if (!account) {
    // Require wallet connection; otherwise let homepage drive flow
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Choose a LetsPay username
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Connect your wallet first.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success screen once registered
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your LetsPay username is live
            </h2>
            <p className="text-gray-600 mt-2">
              Next step: Complete KYC with Self to claim your 200 FLOW credit.
            </p>

            <div className="mt-6 flex gap-3 justify-center">
              <Button onClick={() => navigate("/verify")}>
                KYC with Self
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full">
          <h4 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Claim your free ENS username
          </h4>
          <p className="text-gray-600 mb-6 text-center">
            This will register <strong>[name].letspay.eth</strong> at no cost.
            Then complete KYC to unlock 200 FLOW credit.
          </p>

          <div className="flex items-center gap-2 justify-center mb-3">
            <input
              className="border px-3 py-2 rounded w-64"
              placeholder="yourname"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setIsAvailable(null);
                setError("");
              }}
              disabled={isBusy}
            />
            <span className="text-gray-700">.letspay.eth</span>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              className="!text-white"
              disabled={!normalizedLabel || isBusy}
              onClick={onCheck}
            >
              Check availability
            </Button>
            <Button
              disabled={!normalizedLabel || isBusy || isAvailable === false}
              onClick={onRegister}
            >
              Register
            </Button>
          </div>

          {isBusy && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <span className="h-6 w-6 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Assigning your free LetsPay ENS
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  We're assigning your free LetsPay ENS domain name. Please
                  wait…
                </p>
              </div>
            </div>
          )}

          {isAvailable === true && (
            <div className="text-green-600 text-center mt-3">Available</div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

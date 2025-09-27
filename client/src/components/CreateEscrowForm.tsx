import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

type Props = {
  merchantAddr: string;
  participantsStr: string;
  amountStr: string;
  onMerchantChange: (v: string) => void;
  onParticipantsChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

// ---- ENS RESOLVER HOOK ----
const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY";
const provider = new ethers.JsonRpcProvider(RPC_URL);

function useENSResolver() {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveENS(nameOrAddr: string) {
    setLoading(true);
    setError(null);
    try {
      if (ethers.isAddress(nameOrAddr)) {
        setResolved(ethers.getAddress(nameOrAddr));
      } else {
        const addr = await provider.resolveName(nameOrAddr);
        if (!addr) throw new Error("No address found for ENS name");
        setResolved(addr);
      }
    } catch (err: unknown) {
      console.error("ENS resolution failed", err);
      setError(err instanceof Error ? err.message : String(err));
      setResolved(null);
    } finally {
      setLoading(false);
    }
  }

  return { resolved, loading, error, resolveENS };
}

// ---- MAIN FORM ----
export function CreateEscrowForm({
  merchantAddr,
  participantsStr,
  amountStr,
  onMerchantChange,
  onParticipantsChange,
  onAmountChange,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [merchantInput, setMerchantInput] = useState("");
  const [participantInput, setParticipantInput] = useState("");

  const {
    resolved: resolvedMerchant,
    loading: loadingMerchant,
    error: merchantError,
    resolveENS: resolveMerchantENS,
  } = useENSResolver();

  const {
    resolved: resolvedParticipant,
    loading: loadingParticipant,
    error: participantError,
    resolveENS: resolveParticipantENS,
  } = useENSResolver();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">P</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Create Payment</h2>
          <p className="text-sm text-gray-600">
            Send money to merchant with escrow protection
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Merchant ENS input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Merchant (ENS or Address)
          </label>
          <input
            type="text"
            placeholder="starbucks.letspay.eth or 0x..."
            value={merchantInput}
            onChange={(e) => setMerchantInput(e.target.value)}
            onBlur={() => resolveMerchantENS(merchantInput)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {loadingMerchant && (
            <p className="text-xs text-blue-600 mt-1">Resolving ENS…</p>
          )}
          {resolvedMerchant && (
            <p className="text-xs text-green-600 mt-1">
              Resolved → {resolvedMerchant.slice(0, 6)}…{resolvedMerchant.slice(-4)}
            </p>
          )}
          {merchantError && (
            <p className="text-xs text-red-600 mt-1">{merchantError}</p>
          )}
          {resolvedMerchant &&
            merchantAddr !== resolvedMerchant &&
            (() => {
              onMerchantChange(resolvedMerchant);
              return null;
            })()}
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => onAmountChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              FLOW
            </div>
          </div>
        </div>

        {/* Participants input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participants (ENS or Addresses)
          </label>
          <textarea
            placeholder="0x..., alice.letspay.eth, bob.letspay.eth"
            value={participantsStr}
            onChange={(e) => onParticipantsChange(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="alice.letspay.eth or 0x..."
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onBlur={() => resolveParticipantENS(participantInput)}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <Button
              onClick={() => {
                if (resolvedParticipant) {
                  const current = participantsStr
                    ? participantsStr.split(",").map((s) => s.trim())
                    : [];
                  if (!current.includes(resolvedParticipant)) {
                    onParticipantsChange(
                      [...current, resolvedParticipant].join(", ")
                    );
                  }
                  setParticipantInput("");
                }
              }}
              disabled={!resolvedParticipant}
            >
              Add
            </Button>
          </div>
          {loadingParticipant && (
            <p className="text-xs text-blue-600 mt-1">Resolving ENS…</p>
          )}
          {resolvedParticipant && (
            <p className="text-xs text-green-600 mt-1">
              Resolved → {resolvedParticipant.slice(0, 6)}…
              {resolvedParticipant.slice(-4)}
            </p>
          )}
          {participantError && (
            <p className="text-xs text-red-600 mt-1">{participantError}</p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">ℹ</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                How it works
              </h4>
              <p className="text-sm text-blue-700">
                The payment will be split equally among all participants. The
                merchant receives the full amount, and each participant pays
                their share. The transaction is protected by escrow until all
                participants accept.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={onSubmit}
          disabled={
            isSubmitting || !merchantAddr || !amountStr || !participantsStr
          }
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Processing...
            </span>
          ) : (
            "Create Payment"
          )}
        </Button>
      </div>
    </div>
  );
}

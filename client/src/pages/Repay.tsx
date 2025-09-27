import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RepayForm } from "../components/RepayForm";
import { useLetsPay } from "../lib/useLetsPay";

export default function Repay() {
  const { repayBill } = useLetsPay();
  const [repayAmount, setRepayAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await repayBill(repayAmount);
      if (res && typeof res === "object" && "txHash" in res) {
        setTxHash(res.txHash);
      }
    } catch (err: unknown) {
      const message =
        (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Something went wrong");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [repayBill, repayAmount]);

  return (
    <div className="min-h-screen w-full  bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!txHash ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Repay</h1>
              <p className="text-gray-600">Repay your FLOW credit balance</p>
            </div>
            <RepayForm
              value={repayAmount}
              onChange={setRepayAmount}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />

            {isSubmitting && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <span className="h-6 w-6 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Processing repayment</h3>
                  <p className="text-sm text-gray-600 mt-1">Confirm the transaction in your wallet…</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Repayment successful</h2>
            <p className="text-gray-600 mt-2">Your credit was repaid successfully.</p>
            {txHash && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 break-all">Tx: {txHash}</p>
                <div className="mt-2">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://evm-testnet.flowscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Flow Testnet
                    </a>
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-6 flex gap-3 justify-center">
              <Button className="!text-white" asChild>
                <Link to="/">Go to Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/repay">Make Another Repayment</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



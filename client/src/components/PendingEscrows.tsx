import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon } from "lucide-react";

type Props = {
  escrows: number[];
  onAccept: (id: number) => Promise<{ txHash: string } | void> | { txHash: string } | void;
  onRefresh?: () => Promise<void> | void;
};

export function PendingEscrows({ escrows, onAccept, onRefresh }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    try {
      setIsRefreshing(true);
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  const handleAccept = useCallback(async (id: number) => {
    if (isAccepting) return;
    setError(null);
    setIsAccepting(true);
    setActiveId(id);
    try {
      const res = await onAccept(id);
      if (res && typeof res === "object" && "txHash" in res) {
        setTxHash(res.txHash);
      }
    } catch (err: unknown) {
      const message =
        (typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Failed to accept escrow");
      setError(message);
    } finally {
      setIsAccepting(false);
    }
  }, [isAccepting, onAccept]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pending Transactions</h2>
            <p className="text-sm text-gray-600">Transactions waiting for your approval</p>
          </div>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh pending transactions"
            title="Refresh"
            className="!bg-transparent"
            disabled={isRefreshing}
          >
            <RefreshCcwIcon />
          </Button>
        )}
      </div>
      
      {escrows.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400 font-bold">✓</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">No pending transactions at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escrows.map((id) => (
            <div 
              key={id}
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#{id}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Escrow #{id}</h4>
                  <p className="text-sm text-gray-600">Waiting for your approval</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">Pending</span>
                </div>
                <Button 
                  onClick={() => handleAccept(id)}
                  size="sm"
                  disabled={isAccepting}
                >
                  {isAccepting && activeId === id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Processing
                    </span>
                  ) : (
                    "Accept"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}


      {error && (
        <div className="mt-4 p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isAccepting && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-600/10 flex items-center justify-center">
              <span className="h-6 w-6 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Processing approval</h3>
            <p className="text-sm text-gray-600 mt-1">Confirm the transaction in your wallet…</p>
          </div>
        </div>
      )}

      {txHash && !isAccepting && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Transaction approved</h3>
            <p className="text-sm text-gray-600 mt-2">Your approval has been recorded on-chain.</p>
            <p className="text-xs text-gray-500 mt-2 break-all">Tx: {txHash}</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline">
                <a
                  href={`https://evm-testnet.flowscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Flow Testnet
                </a>
              </Button>
              <Button onClick={() => { setTxHash(null); setActiveId(null); }}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



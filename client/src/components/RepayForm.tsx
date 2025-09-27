import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function RepayForm({ value, onChange, onSubmit, isSubmitting = false }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">R</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Repay Credit</h3>
          <p className="text-sm text-gray-600">Add FLOW to your credit balance</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Repay
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              FLOW
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting || !value || parseFloat(value) <= 0}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Processing...
            </span>
          ) : (
            "Repay Now"
          )}
        </Button>
      </div>
    </div>
  );
}




type Props = {
  account: string;
  creditBal: string;
  username?: string;
};

export function AccountInfo({ account, creditBal }: Props) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Your Balance</h2>
          <p className="text-blue-100">Available Credit</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-2xl">💳</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-4xl font-bold mb-2">{Number(creditBal).toFixed(2)}</div>
        <div className="text-blue-100 text-lg">FLOW</div>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-white/20">
        <div>
          <p className="text-blue-100 text-sm">Wallet</p>
          <p className="font-mono text-sm">{localStorage.getItem("letspay_username") ? `${localStorage.getItem("letspay_username")}` : formatAddress(account)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm">Connected</span>
        </div>
      </div>
    </div>
  );
}



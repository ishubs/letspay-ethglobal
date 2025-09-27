import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";
import { config } from "./config";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function useLetsPay() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [creditBal, setCreditBal] = useState<string>("0");
  const [pending, setPending] = useState<number[]>([]);
  const [isSignedUp, setIsSignedUp] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [ensName, setEnsName] = useState<string>("");
  const [ensPromptNeeded, setEnsPromptNeeded] = useState<boolean>(false);

  const isConnected = !!account;

  const loadCredit = useCallback(async () => {
    if (!contract || !account || !provider) return;
    const raw: bigint = await contract.credit(account);
    setCreditBal(ethers.formatEther(raw));
  }, [contract, account, provider]);



  const loadPending = useCallback(async () => {
    if (!contract || !account) return;
    const ids: bigint[] = await contract.getPendingEscrowsFor(account);
    setPending(ids.map((id) => Number(id)));
  }, [contract, account]);

  const connectWallet = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    if (!eth) {
      alert("Please install MetaMask (Flow EVM testnet)");
      return;
    }
    const prov = new ethers.BrowserProvider(eth as unknown as ethers.Eip1193Provider);
    const s = await prov.getSigner();
    const addr = await s.getAddress();
    await prov.send("wallet_switchEthereumChain", [{ chainId: "0x221" }]);
    const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
    setProvider(prov);
    setSigner(s);
    setAccount(addr);
    setContract(c);

    try {
      const sUp = await c.signedUp(addr);
      setIsSignedUp(Boolean(sUp));
    } catch {
      /* ignore */
    }

    try {
      localStorage.setItem("letspay_connected", "1");
    } catch {
      /* ignore */
    }

    // ✅ Offchain ENS subname check
    try {
      const checkRes = await fetch(`${config.API_BASE_URL}/ens-subnames/${addr}`);
      if (checkRes.ok) {
        const data = (await checkRes.json()) as { subnames?: { name: string }[] };
        if (data?.subnames && data.subnames.length > 0) {
          setEnsName(data.subnames[0].name);
          try {
            localStorage.setItem("letspay_username", data.subnames[0].name);
          } catch (error) {
            console.warn("Failed to save username to localStorage:", error);
          }
        } else {
          setEnsPromptNeeded(true);
        }
      }
    } catch (error) {
      console.log("Error checking ENS subname:", error);
    }
  }, []);

  const signup = useCallback(async () => {
    if (!contract) return;
    const tx = await contract.signup();
    await tx.wait();
    loadCredit();
  }, [contract, loadCredit]);

  const createEscrow = useCallback(
    async (merchantAddr: string, participantsStr: string, amountStr: string) => {
      if (!contract) return;
      if (!merchantAddr || !participantsStr || !amountStr) {
        throw new Error("Please fill all fields");
      }

      const participants = participantsStr.split(",").map((p) => p.trim());
      const total = ethers.parseEther(amountStr);

      const totalParticipants = participants.length + 1;
      const sharePer = total / BigInt(totalParticipants);
      const shares = participants.map(() => sharePer);

      const remainder = total - sharePer * BigInt(totalParticipants);
      if (remainder > 0n && participants.length > 0) {
        const reductionPerParticipant = remainder / BigInt(participants.length);
        const finalRemainder = remainder % BigInt(participants.length);
        for (let i = 0; i < shares.length; i++) {
          shares[i] = shares[i] - reductionPerParticipant;
        }
        if (finalRemainder > 0n) {
          shares[0] = shares[0] - finalRemainder;
        }
      }

      try {
        const tx = await contract.createEscrow(merchantAddr, participants, shares, total);
        await tx.wait();
        await Promise.all([loadCredit(), loadPending()]);
        return { txHash: tx.hash } as const;
      } catch (error: unknown) {
        console.error("Error creating escrow:", error);
        const message =
          (typeof error === "object" &&
            error !== null &&
            (("reason" in error && typeof (error as { reason?: string }).reason === "string" && (error as { reason: string }).reason) ||
              ("data" in error &&
                typeof (error as { data?: { message?: string } }).data?.message === "string" &&
                (error as { data: { message: string } }).data.message) ||
              ("message" in error &&
                typeof (error as { message?: string }).message === "string" &&
                (error as { message: string }).message))) ||
          "Failed to create escrow";
        throw new Error(message);
      }
    },
    [contract, loadCredit, loadPending]
  );

  const acceptEscrow = useCallback(
    async (id: number) => {
      if (!contract) return;
      try {
        const tx = await contract.accept(id);
        await tx.wait();
        await Promise.all([loadCredit(), loadPending()]);
        return { txHash: tx.hash } as const;
      } catch (error: unknown) {
        console.error("Error accepting escrow:", error);
        const message =
          (typeof error === "object" &&
            error !== null &&
            (("reason" in error && typeof (error as { reason?: string }).reason === "string" && (error as { reason: string }).reason) ||
              ("data" in error &&
                typeof (error as { data?: { message?: string } }).data?.message === "string" &&
                (error as { data: { message: string } }).data.message) ||
              ("message" in error &&
                typeof (error as { message?: string }).message === "string" &&
                (error as { message: string }).message))) ||
          "Failed to accept escrow";
        throw new Error(message);
      }
    },
    [contract, loadCredit, loadPending]
  );

  const loadSignedUp = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const s: boolean = await contract.signedUp(account);
      setIsSignedUp(Boolean(s));
    } catch {
      /* ignore */
    }
  }, [contract, account]);

  const loadVerificationStatus = useCallback(async () => {
    try {
      if (!account) return;
      try {
        const skipped = localStorage.getItem("letspay_verified");
        if (skipped === "1") {
          setIsVerified(true);
          return;
        }
      } catch (error) {
        console.warn("Failed to check verification status:", error);
      }
      const res = await fetch(`${config.VERIFICATION_BASE_URL}/verification-status/${account}`);
      if (!res.ok) return;
      const data = await res.json();
      setIsVerified(Boolean(data?.verified));
    } catch {
      /* ignore */
    }
  }, [account]);

  const repayBill = useCallback(
    async (repayAmountStr: string) => {
      if (!contract) throw new Error("Contract not connected");
      if (!repayAmountStr) throw new Error("Please enter repay amount");
      try {
        const repayAmount = ethers.parseEther(repayAmountStr);
        if (repayAmount <= 0n) throw new Error("Repay amount must be greater than 0");
        const balance = await provider?.getBalance(account);
        if (balance && balance < repayAmount) throw new Error("Insufficient balance to repay this amount");
        const tx = await contract.repayCredit({ value: repayAmount });
        await tx.wait();
        await loadCredit();
        return { txHash: tx.hash } as const;
      } catch (err: unknown) {
        console.error("Error repaying bill:", err);
        const message =
          (typeof err === "object" &&
            err !== null &&
            (("reason" in err && typeof (err as { reason?: string }).reason === "string" && (err as { reason: string }).reason) ||
              ("data" in err &&
                typeof (err as { data?: { message?: string } }).data?.message === "string" &&
                (err as { data: { message: string } }).data.message) ||
              ("message" in err &&
                typeof (err as { message?: string }).message === "string" &&
                (err as { message: string }).message))) ||
          "Failed to repay bill";
        throw new Error(message);
      }
    },
    [contract, provider, account, loadCredit]
  );

  useEffect(() => {
    if (contract && account) {
      loadCredit();
      loadPending();
      loadSignedUp();
      loadVerificationStatus();
      try {
        const cached = localStorage.getItem("letspay_username");
        if (cached) setEnsName(cached);
      } catch (error) {
        console.warn("Failed to load cached username:", error);
      }
      (async () => {
        try {
          const res = await fetch(`${config.API_BASE_URL}/ens-subnames/${account}`);
          if (res.ok) {
            const data = (await res.json()) as { subnames?: { name: string }[] };
            if (data?.subnames && data.subnames.length > 0) {
              setEnsName(data.subnames[0].name);
              try {
                localStorage.setItem("letspay_username", data.subnames[0].name);
              } catch (error) {
                console.warn("Failed to save username to localStorage:", error);
              }
            } else {
              setEnsPromptNeeded(true);
            }
          }
        } catch (error) {
          console.warn("Failed to check ENS subname:", error);
        }
      })();
    }
  }, [contract, account, loadCredit, loadPending, loadSignedUp, loadVerificationStatus]);

  useEffect(() => {
    const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
    if (!eth) return;
    const ethProvider = eth;
    let unsubscribed = false;

    async function silentReconnect() {
      try {
        const accounts = (await ethProvider.request({ method: "eth_accounts" })) as string[];
        if (unsubscribed) return;
        if (accounts && accounts.length > 0) {
          const prov = new ethers.BrowserProvider(ethProvider as unknown as ethers.Eip1193Provider);
          try {
            await prov.send("wallet_switchEthereumChain", [{ chainId: "0x221" }]);
          } catch (error) {
            console.error("Failed to switch Ethereum chain to 0x221:", error);
          }
          const s = await prov.getSigner();
          const addr = accounts[0];
          const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s);
          setProvider(prov);
          setSigner(s);
          setAccount(addr);
          setContract(c);
          try {
            const su: boolean = await c.signedUp(addr);
            setIsSignedUp(Boolean(su));
          } catch (error) {
            console.warn("Failed to check signup status:", error);
          }
        }
      } catch (error) {
        console.warn("Failed to reconnect wallet:", error);
      }
    }

    silentReconnect();

    function onAccountsChanged(accs: string[]) {
      if (!accs || accs.length === 0) {
        setAccount("");
        setSigner(null);
        setProvider(null);
        setContract(null);
        setIsSignedUp(false);
        setEnsName("");
        try { localStorage.removeItem("letspay_connected"); } catch (error) {
          console.warn("Failed to remove connected flag:", error);
        }
        try { localStorage.removeItem("letspay_verified"); } catch (error) {
          console.warn("Failed to remove verified flag:", error);
        }
        try { localStorage.removeItem("letspay_username"); } catch (error) {
          console.warn("Failed to remove username:", error);
        }
      } else {
        silentReconnect();
      }
    }

    function onChainChanged() {
      window.location.reload();
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accs = (args && args[0] ? (args[0] as string[]) : []) || [];
      onAccountsChanged(accs);
    };
    const handleChainChanged = () => onChainChanged();

    if (ethProvider.on) {
      ethProvider.on("accountsChanged", handleAccountsChanged);
      ethProvider.on("chainChanged", handleChainChanged);
    }

    return () => {
      unsubscribed = true;
      if (ethProvider && ethProvider.removeListener) {
        ethProvider.removeListener("accountsChanged", handleAccountsChanged);
        ethProvider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  const checkEnsAvailability = async (label: string) => {
    if (!label) return false;
    const res = await fetch(`${config.API_BASE_URL}/ens-availability/${encodeURIComponent(label.toLowerCase())}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { available?: boolean };
    return Boolean(data?.available);
  };

  const registerEns = async (label: string) => {
    if (!account) throw new Error("Not connected");
    const res = await fetch(`${config.API_BASE_URL}/register-subname`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.toLowerCase(), owner: account }),
    });
    if (!res.ok) throw new Error("Failed to register ENS subname");
    const data = (await res.json()) as { success?: boolean; subname?: { name: string; owner: string } };
    console.log(data,  " :data")
    if (data.success) {
      setEnsName(label);
      console.log(label,  " :label")
      localStorage.setItem("letspay_username", `${label}.letspay.eth`);
      setEnsPromptNeeded(false);
    }
    return { success: true };
  };

  return {
    provider,
    signer,
    account,
    contract,
    creditBal,
    pending,
    isConnected,
    isSignedUp,
    isVerified,
    ensName,
    ensPromptNeeded,
    checkEnsAvailability,
    registerEns,
    connectWallet,
    signup,
    createEscrow,
    acceptEscrow,
    repayBill,
    loadCredit,
    loadPending,
    loadSignedUp,
    loadVerificationStatus,
    markVerified: () => {
      setIsVerified(true);
      try { localStorage.setItem("letspay_verified", "1"); } catch (error) {
        console.warn("Failed to save verification status:", error);
      }
    },
  };
}

# LetsPay

**A decentralized group payments app with ENS-powered identities, zk-KYC via Self, and Flow-based on-chain payments.**

LetsPay makes splitting bills seamless, secure, and user-friendly. Users no longer need to worry about reminding friends to pay them back — the system ensures real-time reimbursements while maintaining a credit score on-chain.

---

## Core Idea

- **Web3 First:**  
  Leveraging decentralized identities and payments for trustless group transactions.

- **ENS Integration:**  
  Every user and merchant gets a friendly payment handle like `[username].letspay.eth`, backed by a primary ENS domain `letspay.eth`.  
  - Easier to remember than wallet addresses  
  - Protects against swap-wallet scams  
  - Human-readable payments  

- **Self.xyz zk-KYC:**  
  Identity verification is crucial for payments. LetsPay integrates [Self.xyz](https://tools.self.xyz/) to enable **zero-knowledge KYC proofs**, ensuring users are verified without exposing sensitive data.

- **Flow Payments:**  
  Built on [Flow](https://www.onflow.org/) blockchain for:  
  - Fast finality  
  - Low transaction fees  
  - Scalability for mass adoption  

- **On-chain Credit Score:**  
  Users start with micro-credit and build their **decentralized credit score** as they transact on Flow.

---

## Monorepo Structure

The repo contains **four key projects**:

1. **Backend**  
   Core backend APIs powering LetsPay.

2. **Backend Service for ENS**  
   Handles ENS-related operations for merchant and user subdomains under `letspay.eth`.

3. **Flow Contracts**  
   Smart contracts on Flow managing payment rails and credit scoring.  

   **Deployed contract address:**  
- flow: 0xcc61062c0a1239F9fF0500Eeee2E4E4d4B399dfA
- Self: 0xE34A7b915A605d7Df7C024889Ea52302F8640112


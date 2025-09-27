import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { ChainName, createOffchainClient } from "@thenamespace/offchain-manager";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---- CONFIG ----
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const NAMESPACE_API_KEY = requireEnv("NAMESPACE_API_KEY");
const MODE = process.env.MODE || "sepolia"; // or mainnet

// Init Namespace client
const client = createOffchainClient({
  mode: MODE as "sepolia" | "mainnet",
  defaultApiKey: NAMESPACE_API_KEY,
});

// ---- API ENDPOINTS ----

// Create a subname
app.post("/register-subname", async (req, res) => {
  try {
    const { label, owner } = req.body;
    if (!label || !owner) {
      return res.status(400).json({ error: "Missing label or owner" });
    }

    const subname = await client.createSubname({
      label,
      parentName: "letspay.eth",
      owner,
      texts: [],
      addresses: [{ value: owner, chain: ChainName.Ethereum}],
    });

    return res.json({ success: true, subname });
  } catch (err) {
    console.error("Error creating subname:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Check availability
app.get("/ens-availability/:label", async (req, res) => {
  try {
    const label = req.params.label.toLowerCase();
    const subname = `${label}.letspay.eth`;
    const available = await client.isSubnameAvailable(subname);

    return res.json({ available, subname });
  } catch (err) {
    console.error("Error checking availability:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Get subnames for a user
app.get("/ens-subnames/:owner", async (req, res) => {
  try {
    const owner = req.params.owner;
    const subnames = await client.getFilteredSubnames({
      parentName: "letspay.eth",
      owner,
    });

    return res.json({ subnames });
  } catch (err) {
    console.error("Error fetching subnames:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ---- START SERVER ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LetsPay ENS offchain backend running on port ${PORT}`);
});

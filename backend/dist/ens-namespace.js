"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const offchain_manager_1 = require("@thenamespace/offchain-manager");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// ---- CONFIG ----
function requireEnv(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required env var: ${name}`);
    return value;
}
const NAMESPACE_API_KEY = requireEnv("NAMESPACE_API_KEY");
const MODE = process.env.MODE || "sepolia"; // or mainnet
// Init Namespace client
const client = (0, offchain_manager_1.createOffchainClient)({
    mode: MODE,
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
            addresses: [{ value: owner, chain: offchain_manager_1.ChainName.Ethereum }],
        });
        return res.json({ success: true, subname });
    }
    catch (err) {
        console.error("Error creating subname:", err);
        return res.status(500).json({ error: err.message });
    }
});
// Check availability
app.get("/ens-availability/:label", async (req, res) => {
    try {
        const label = req.params.label.toLowerCase();
        const subname = `${label}.letspay.eth`;
        const available = await client.isSubnameAvailable(subname);
        return res.json({ available, subname });
    }
    catch (err) {
        console.error("Error checking availability:", err);
        return res.status(500).json({ error: err.message });
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
    }
    catch (err) {
        console.error("Error fetching subnames:", err);
        return res.status(500).json({ error: err.message });
    }
});
// ---- START SERVER ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`LetsPay ENS offchain backend running on port ${PORT}`);
});

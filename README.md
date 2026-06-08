# Decentralized Scholarship Funding DApp

A decentralized application (DApp) on the Ethereum blockchain that allows users to donate ETH, apply for scholarships, and release funds (Admin only) using a smart contract.

## Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.0.0 or later)
- [Truffle](https://archive.trufflesuite.com/docs/truffle/getting-started/installation/) (`npm install -g truffle`)
- [Ganache](https://archive.trufflesuite.com/ganache/) (CLI or GUI)
- [MetaMask](https://metamask.io/) browser extension

## Setup & Deployment

1. **Clone the repository and install dependencies (if any):**
   ```bash
   git clone git@github.com:Twarimitswe-Aaron/scholarship-daap.git
   cd scholarship-daap
   ```

2. **Start Ganache:**
   Open the Ganache GUI and click "Quickstart", or run the CLI:
   ```bash
   ganache-cli
   ```
   *Ganache runs a local, temporary blockchain on `http://127.0.0.1:8545`.*

3. **Deploy the Smart Contract:**
   ```bash
   npx truffle migrate
   ```
   Note the deployed contract address output in the terminal.

4. **Update Frontend Configuration:**
   Open `client/web3.js` and update `contractAddress` on Line 1 with your newly deployed contract address.

## How to Run

1. **Serve the Web App:**
   Inside the `client` directory, run a local web server:
   ```bash
   cd client
   npx http-server
   ```
   Visit `http://127.0.0.1:8080` in your browser.

2. **Connect MetaMask:**
   - Import the Ganache mnemonic phrase into MetaMask.
   - Add/Switch to the Ganache Local Network (`http://127.0.0.1:8545`, Chain ID `1337`).
   - Click "Connect Wallet" on the web page.

## Important Notes & Troubleshooting

### Does this use real money?
**No.** When testing on the Ganache local network, you are using "fake" test Ethereum provided by Ganache. It has zero real-world value and is disconnected from your actual bank accounts or mainnet crypto wallets.

### I can't access the "Release Funds (Admin ONLY)" option!
The smart contract permanently assigns the **Admin** role to the account that deployed the contract (`msg.sender` in the constructor). 
- By default, Truffle uses the **first account (Account 0)** in Ganache to deploy contracts.
- To use the Admin features, you must open MetaMask, switch to that specific Account 0 from Ganache, and refresh the page. Any other account will receive an `"Only admin can release funds"` error.

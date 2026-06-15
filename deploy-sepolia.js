/**
 * deploy-sepolia.js
 * Standalone Sepolia deployment script using native Node.js HTTPS.
 * Bypasses @truffle/hdwallet-provider and its incompatible eth-block-tracker.
 *
 * Usage:  node deploy-sepolia.js
 */

const https    = require('https');
const fs       = require('fs');
const path     = require('path');
const Web3     = require('web3');
require('dotenv').config();

// ─── Config ──────────────────────────────────────────────────────────────────
const RPC_URL    = process.env.ALCHEMY_URL;
const PRIV_KEY   = process.env.PRIVATE_KEY.startsWith('0x')
    ? process.env.PRIVATE_KEY
    : '0x' + process.env.PRIVATE_KEY;
const CHAIN_ID   = 11155111; // Sepolia
const ARTIFACT   = path.join(__dirname, 'build', 'contracts', 'Scholarship.json');
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀  Sepolia Deployment Script (Native HTTPS)');
    console.log('RPC URL:', RPC_URL);

    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

    const account = web3.eth.accounts.privateKeyToAccount(PRIV_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log('Deployer address:', account.address);

    const balWei = await web3.eth.getBalance(account.address);
    const balEth = parseFloat(web3.utils.fromWei(balWei, 'ether'));
    console.log('Balance:', balEth.toFixed(6), 'ETH');
    if (balEth < 0.001) {
        console.error('❌ Insufficient Sepolia ETH. Get free ETH from https://sepoliafaucet.com');
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'));
    const { abi, bytecode } = artifact;
    if (!bytecode || bytecode === '0x') {
        console.error('❌ No bytecode found. Run: npx truffle compile');
        process.exit(1);
    }

    const contract = new web3.eth.Contract(abi);
    console.log('\nDeploying Scholarship contract to Sepolia...');
    const tx = contract.deploy({ data: bytecode });

    const gas = await tx.estimateGas({ from: account.address });
    const gasPrice = await web3.eth.getGasPrice();
    const gasCost  = web3.utils.fromWei(String(BigInt(gas) * BigInt(gasPrice) * 12n / 10n), 'ether');
    console.log(`Estimated gas: ${gas} (~${parseFloat(gasCost).toFixed(6)} ETH)`);

    const deployed = await tx.send({
        from:     account.address,
        gas:      Math.floor(gas * 1.2),
        gasPrice: gasPrice,
    });

    const address = deployed.options.address;
    console.log('\n✅  Contract deployed!');
    console.log('   Address:', address);

    // Update build artifact
    artifact.networks = artifact.networks || {};
    artifact.networks[String(CHAIN_ID)] = {
        events: {},
        links:  {},
        address: address,
        transactionHash: deployed.transactionHash || '',
    };
    fs.writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
    console.log('   Build artifact updated:', ARTIFACT);

    // ⚠️ Scholarship uses a hardcoded address in client/web3.js
    // Print it so the user can update it:
    console.log('\n⚠️  Action required: update contractAddress in client/web3.js:');
    console.log(`   const contractAddress = "${address}";`);

    console.log('\n🎉  Done!');
    process.exit(0);
}

main().catch(err => {
    console.error('\n❌ Deployment failed:', err.message || err);
    process.exit(1);
});

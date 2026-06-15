const contractAddress = "0xDE3A9Bc278fd7FFc5911e4e7Bc8560B1e9901B12";
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "applicant",
                "type": "address"
            }
        ],
        "name": "Applied",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "donor",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Donated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "FundsReleased",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "admin",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "applicants",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "applyForScholarship",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "donate",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "recipient",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDonations",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let web3;
let contract;
let accounts;

// Fix #13: Known public network IDs — warn user if on wrong network
const KNOWN_PUBLIC_NET_IDS = {
    1:        "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
    5:        "Goerli Testnet",
    137:      "Polygon Mainnet",
};

// Fix #12: Refresh and display the contract's ETH balance
async function refreshBalance() {
    if (!contract) return;
    try {
        const balanceWei = await contract.methods.getBalance().call();
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.innerText = `📦 Contract Balance: ${parseFloat(balanceEth).toFixed(4)} ETH`;
        }
    } catch (err) {
        console.warn("Could not fetch balance:", err);
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not detected! Please install the MetaMask browser extension.");
        return;
    }

    web3 = new Web3(window.ethereum);
    try {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        document.getElementById('account').innerText = `✅ Connected: ${accounts[0]}`;

        // Fix #13: Warn if connected to a public/wrong network
        const netId = await web3.eth.net.getId();
        if (KNOWN_PUBLIC_NET_IDS[netId]) {
            const proceed = confirm(
                `⚠️ Warning: You are connected to ${KNOWN_PUBLIC_NET_IDS[netId]} (ID: ${netId}).\n` +
                "This DApp is intended for a local Ganache network.\n\n" +
                "Press OK to continue anyway, or Cancel to abort."
            );
            if (!proceed) return;
        }

        contract = new web3.eth.Contract(contractABI, contractAddress);

        // Fix #12: Show balance immediately after connecting
        await refreshBalance();

        // Fix #14: Update state if user switches accounts in MetaMask
        window.ethereum.on('accountsChanged', async (newAccounts) => {
            accounts = newAccounts;
            document.getElementById('account').innerText = `✅ Connected: ${accounts[0]}`;
            await refreshBalance();
        });

        // Reload page if network changes to prevent stale state
        window.ethereum.on('chainChanged', () => {
            alert("Network changed. Reloading the page.");
            window.location.reload();
        });

    } catch (error) {
        console.error("User denied account access", error);
        alert("Wallet connection failed: " + error.message);
    }
}

// Fix #9: Guard helper — check wallet is connected before any transaction
function requireWallet() {
    if (!contract || !accounts || !accounts[0]) {
        alert("Please connect your wallet first by clicking 'Connect Wallet'.");
        return false;
    }
    return true;
}

async function donate() {
    if (!requireWallet()) return; // Fix #9

    const amount = document.getElementById('donationAmount').value.trim();
    if (!amount) {
        alert("Please enter a donation amount.");
        return;
    }

    // Fix #10: Validate that the input is a valid positive number
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
        alert("Please enter a valid positive number for the ETH amount.");
        return;
    }

    const weiValue = web3.utils.toWei(amount, 'ether');
    try {
        await contract.methods.donate().send({
            from: accounts[0],
            value: weiValue
        });
        alert("✅ Donation successful! Thank you.");
        document.getElementById('donationAmount').value = '';
        await refreshBalance(); // Fix #12: update balance after donation
    } catch (error) {
        console.error("Donation failed", error);
        alert("❌ Donation failed: " + error.message);
    }
}

async function applyForScholarship() {
    if (!requireWallet()) return; // Fix #9

    try {
        await contract.methods.applyForScholarship().send({ from: accounts[0] });
        alert("✅ Scholarship application submitted successfully!");
    } catch (error) {
        console.error("Application failed", error);
        // Provide readable message for common revert
        if (error.message && error.message.includes("Already applied")) {
            alert("❌ You have already applied for the scholarship with this account.");
        } else {
            alert("❌ Application failed: " + error.message);
        }
    }
}

async function releaseFunds() {
    if (!requireWallet()) return; // Fix #9

    const recipient = document.getElementById('recipientAddress').value.trim();
    const amountInput = document.getElementById('releaseAmount').value.trim(); // Fix #8

    // Fix #11: Validate the recipient address before sending
    if (!recipient) {
        alert("Please enter a recipient address.");
        return;
    }
    if (!web3.utils.isAddress(recipient)) {
        alert("❌ Invalid Ethereum address. Please enter a valid 0x... address.");
        return;
    }

    // Fix #8: Validate amount instead of using hardcoded 1 ETH
    if (!amountInput) {
        alert("Please enter an amount in ETH to release.");
        return;
    }
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Please enter a valid positive number for the ETH amount.");
        return;
    }

    const amount = web3.utils.toWei(amountInput, 'ether');

    try {
        await contract.methods.releaseFunds(recipient, amount).send({ from: accounts[0] });
        alert(`✅ ${amountInput} ETH successfully released to ${recipient}`);
        document.getElementById('recipientAddress').value = '';
        document.getElementById('releaseAmount').value = '';
        await refreshBalance(); // Fix #12: update balance after release
    } catch (error) {
        console.error("Fund release failed", error);
        if (error.message && error.message.includes("Only admin")) {
            alert("❌ Access denied: Only the contract admin can release funds.");
        } else if (error.message && error.message.includes("Insufficient balance")) {
            alert("❌ The contract does not have enough ETH to release that amount.");
        } else {
            alert("❌ Fund release failed: " + error.message);
        }
    }
}

//Welcome to my Solana Blockchain new pair creation sniper bot
//The purpose is to buy a token on the Solana blockchain as soon as possible and sell it for a quick profit on top of other buyers

const WebSocket = require('ws');
const bs58 = require('bs58').default;
const { VersionedTransaction, Connection, Keypair } = require('@solana/web3.js');

const RPC_ENDPOINT = "X"; //Insert your chosen RPC endpoint here
const web3Connection = new Connection(RPC_ENDPOINT, 'confirmed');
const ws = new WebSocket("wss://pumpportal.fun/api/data");

let isProcessing = false; //Flag to track active transaction

ws.on("open", function open() {
  let payload = { method: "subscribeNewToken" };
  ws.send(JSON.stringify(payload));
});

ws.on("message", function message(data) {
  if (isProcessing) return; //Prevent new purchase if one is ongoing

  console.log(JSON.parse(data));
  const tokenCreationData = JSON.parse(data);
  if (tokenCreationData.mint) {
    isProcessing = true; //Set flag to prevent new purchases
    console.log("Buying: " + tokenCreationData.mint);
    
    sendPumpTransaction("buy", tokenCreationData.mint, 0.003).then(() => {
      setTimeout(() => {
        console.log("Selling: " + tokenCreationData.mint);
        sendPumpTransaction("sell", tokenCreationData.mint, "100%").then(() => {
          isProcessing = false; //Reset flag after selling
        });
      }, 4000);
    });
  }
});

async function sendPumpTransaction(action, mint, amount) {
  const signerKeyPair = Keypair.fromSecretKey(bs58.decode("X")); // Insert your private key here
  const signerPublicKey = signerKeyPair.publicKey.toBase58();
  
  const response = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: signerPublicKey,
      action,
      mint,
      denominatedInSol: "true",
      amount,
      slippage: 15,
      priorityFee: 0.000005,
      pool: "pump"
    })
  });
  
  if (response.status === 200) {
    const data = await response.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(data));
    tx.sign([signerKeyPair]);
    
    try {
      const signature = await web3Connection.sendTransaction(tx, { preflightCommitment: "processed" });
      console.log("Transaction: https://solscan.io/tx/" + signature);
    } catch (e) {
      console.error(e.message);
    }
  } else {
    console.log(response.statusText);
  }
}


import { API_KEY } from './config.js';
import { MINT_TX_TEST } from './test.js';
const ALL_TRANSACTION_STRING = "ALL TRANSACTIONS"
const MINT_STRING = "MINT TRANSACTIONS"
const ASSET_STRING = "SPECIFIC ASSET"
function handleSubmit() {
  const searchBar = document.getElementById("search-bar");
  const searchBarValue = searchBar.value;

  //addr1q9ezzague67wzye6lpwvqs8swcr8y4xt87dml4zep99n4ffprcxk4qu56t4u8zhgtsry2l9ual69q9hygznf93v0vyfsh2gq2p
  //addr1qydp5tjzex2xa87p8kz9hvm7e7mqj8wul28ylggvvrjf7n5sgq4a3gmwkf5ugalw6hgr8uvv4fk24mnl87hfcsx3pzjs3xkc73
  if (!searchBarValue.startsWith("addr")) {
    console.log("Error: Address must begin with addr");
    return;
  }
  window.location = "address.html?" + `addr=${searchBarValue}`;
}

function loadAddress() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  if (urlSearchParams.has("addr")) {
    const formData = Object.fromEntries(urlSearchParams.entries());
    updateDom(formData.addr);
  }
}

async function updateDom(address) {
  //updateAddress(address);

  // //1. Get all transactions
  // const transactions = await getAllTransactions(address);
  // if (transactions.length === 0) {
  //   //TO DO
  //   console.log("No transactions found in this address.");
  //   return;
  // }

  // //2. Find if any of those transactions are minted
  // //const testTx = ["88f5251bac8923cb70ae4826b2b491493ccf564fbb2f1384427fca68133f6786"];
  // //const mintTransactions = await getAllMintTransactions(testTx);
  // const mintTransactions = await getAllMintTransactions(transactions);
  // console.log(mintTransactions);

  // if (mintTransactions.length === 0) {
  //   //TO DO
  //   console.log("No mint transactions found in this address.");
  //   return;
  // }

  //3. Find and replace output amount
  const mintTxWithName = MINT_TX_TEST;
  //const mintTxWithName = await getSpecificAsset(mintTransactions);

  updateAddressSection(address, mintTxWithName);//Replace with mintTransactions

  //4. Format transactions 
  const formattedTransactions = formatTransactions(mintTxWithName);
  console.log(formattedTransactions);
  updateTransactionSection(formattedTransactions);

}

async function getAllTransactions(address) {
  const jsonData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/transactions`, ALL_TRANSACTION_STRING);
  const transactions = [];

  for (let i = 0; i < jsonData.length; i++) {
    transactions.push(jsonData[i].tx_hash);
  }

  return transactions;
}

async function getAllMintTransactions(transactions) {
  const mintTransactions = [];
  for (let i = 0; i < transactions.length; i++) {
    const jsonData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${transactions[i]}`, MINT_STRING);
    if (jsonData.asset_mint_or_burn_count === 1) {
      mintTransactions.push(jsonData);
    }
  }
  return mintTransactions;
}
async function getSpecificAsset(mintTransactions) {
  let assetName = "";
  for (let i = 0; i < mintTransactions.length; i++) {
    const param = mintTransactions[i].output_amount[1].unit;
    const jsonData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${param}`, ASSET_STRING);

    console.log(jsonData);
    //For on chain metadata 
    if (jsonData.onchain_metadata !== null) {
      if (jsonData.onchain_metadata.hasOwnProperty("asset_ID")) {
        assetName = jsonData.onchain_metadata["asset ID"];
      }
      else {
        assetName = jsonData.onchain_metadata["name"];
      }
    }

    //Add asset name to mint transaction
    mintTransactions[i].output_amount[1].name = assetName;
  }
  return mintTransactions;
}

function formatTransactions(transactions) {

  const formattedTransactions = [];
  for (let i = 0; i < transactions.length; i++) {

    const { block_time, hash } = transactions[i];
    const { name } = transactions[i].output_amount[1];

    const formattedDate = new Date(block_time * 1000);
    formattedTransactions.push({
      block_time: formattedDate.toLocaleString(),
      hash: hash,
      name: name
    });
  }
  return formattedTransactions;
}

async function fetchData(url, wantedData) {
  console.log("Fetching: ", wantedData)
  const response = await fetch(url, { headers: { 'project_id': `${API_KEY}` } })
  if (response.status != 200) {
    console.log(`Error fetching ${wantedData} transactions: `, response)
    return;
  }
  const jsonData = await response.json();
  return jsonData;
}

function updateAddressSection(address, transactions) {
  const addressSection = document.getElementById("address-section");
  const addressHeader = document.createElement("h2");
  addressHeader.innerText = "Address";
  addressHeader.classList.add("subheader-text");
  addressSection.appendChild(addressHeader);

  const newDiv = document.createElement("div");
  newDiv.classList.add("address");

  newDiv.innerHTML = `
    <div class="address-row">
      <p class="address-label">Address: </p>
      <p>
        <a href = "https://cardanoscan.io/address/${address}" 
          target="_blank" class="cardanoScan-link">
        ${address}
        </a>
      </p>
    </div>
    <div class="address-row">
      <p class="address-label">Total Transactions:  </p>
      <p>10 </p>
    </div>
    <div class="address-row">
      <p class="address-label">Mint Transactions:  </p>
      <p>${transactions.length} </p>
    </div>
  `;
  addressSection.appendChild(newDiv);
}

function updateTransactionSection(transactions) {
  const transactionsSection = document.getElementById("transactions-section");
  const transactionHeader = document.createElement("h2");
  transactionHeader.innerText = "Transactions";
  transactionHeader.classList.add("subheader-text");
  transactionsSection.appendChild(transactionHeader);

  for (let i = 0; i < transactions.length; i++) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("transaction");

    newDiv.innerHTML = `
      <div class="transaction-row">
        <p class="transaction-label">Transaction id: </p>
        <p>
          <a href = "https://cardanoscan.io/transaction/${transactions[i].hash}" 
            target="_blank" class="cardanoScan-link">
            ${transactions[i].hash}
          </a>
        </p>
      </div>
      <div class="transaction-row">
      <p  class="transaction-label"> Received time: </p>
      <p> ${transactions[i].block_time}</p>
      </div>
      <div class="transaction-row">
      <p  class="transaction-label"> Asset name: </p>
      <p> ${transactions[i].name}</p>
      </div>
    `;

    transactionsSection.appendChild(newDiv);
  }
}

function addSearchEventListener() {
  const form = document.querySelector('form');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });
}

addSearchEventListener();
loadAddress();
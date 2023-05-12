
import { API_KEY } from './config.js';
const ALL_TRANSACTION_STRING = "ALL TRANSACTIONS"
const MINT_STRING = "MINT TRANSACTIONS"

function handleSubmit() {
  const searchBar = document.getElementById("search-bar");
  const searchBarValue = searchBar.value;

  //addr1q9ezzague67wzye6lpwvqs8swcr8y4xt87dml4zep99n4ffprcxk4qu56t4u8zhgtsry2l9ual69q9hygznf93v0vyfsh2gq2p
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

  //1. Get all transactions
  const transactions = await getAllTransactions(address);
  if (transactions.length === 0) {
    console.log("No transactions found in this address.");
    return;
  }
  //2. Find if any of those transactions are minted
  const mintTransactions = await getAllMintTransactions(transactions);
  //console.log(mintTransactions);

  //3. Format transactions 
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
  // mintTransactions.filter((item) => {
  //   console.log(item);
  // });
  return mintTransactions;
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
// function updateAddress(address) {
//   //const addressHeader = document.getElementById("address-header");
//   //addressHeader.innerHTML = address;
//   //getMintTx(address)
// }

function addSearchEventListener() {
  const form = document.querySelector('form');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });
}

addSearchEventListener();
loadAddress();
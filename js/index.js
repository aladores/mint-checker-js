
import { API_KEY } from './config.js';
import { MINT_TX_TEST, MULTIPLE_MINT_TX_TEST } from './tests/test.js';
import { LARGE_TX_TEST, LARGE_MINT_TX_TEST } from './tests/largeTest.js';
const ALL_TRANSACTION_STRING = "ALL TRANSACTIONS"
const MINT_STRING = "MINT TRANSACTIONS"
const ASSET_STRING = "SPECIFIC ASSET"
function handleSubmit() {
  const searchBar = document.getElementById("search-bar");
  const searchBarValue = searchBar.value;

  //Spam 1: addr1qxyezkc02lpz0y8l587lhckpcjsed0v7wrjayut9alc75xkqgcy2x7t7d58zyt2rydep075va5xluwuqsdpssk60m4fqgccl75
  //Spam 2: addr1qydp5tjzex2xa87p8kz9hvm7e7mqj8wul28ylggvvrjf7n5sgq4a3gmwkf5ugalw6hgr8uvv4fk24mnl87hfcsx3pzjs3xkc73
  if (!searchBarValue.startsWith("addr")) {
    console.log("Address must begin with addr");
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

  toggleAddressLoader();
  //1. Get all transactions
  const transactions = await getAllTransactions(address);
  if (transactions.length === 0) {
    updateError("No transactions found in this address:", address);
    return;
  }

  //2. Find if any of those transactions are minted
  const mintTransactions = await getAllMintTransactions(transactions);
  if (mintTransactions.length === 0) {
    updateError("No mint transactions found in this address:", address);
    return;
  }

  //3. Find and replace output amount
  const mintTxWithName = await getSpecificAsset(mintTransactions);
  updateAddressSection(address, LARGE_TX_TEST, LARGE_MINT_TX_TEST);

  //4. Format transactions 
  const formattedTransactions = formatTransactions(LARGE_MINT_TX_TEST);

  setTimeout(() => {
    updateTransactionSection(formattedTransactions);
  }, 2000);
}

async function getAllTransactions(address) {
  const jsonData = await fetchPaginatedData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/transactions`, ALL_TRANSACTION_STRING);
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
    if (jsonData.asset_mint_or_burn_count > 0) {
      mintTransactions.push(jsonData);
    }
  }
  return mintTransactions;
}
async function getSpecificAsset(mintTransactions) {
  let assetName = "";
  let param = "";
  for (let i = 0; i < mintTransactions.length; i++) {
    const outputAmountSize = mintTransactions[i].output_amount.length;
    //TO DO: asset_mint_or_burn_count > 5 
    //likely chance uxto mint have to find a way to fix that
    for (let j = 1; j < outputAmountSize; j++) {
      param = mintTransactions[i].output_amount[j].unit;
      const jsonData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${param}`, ASSET_STRING);
      //Change to switch statement?
      if (jsonData.onchain_metadata !== null) {
        if (jsonData.onchain_metadata.hasOwnProperty("asset_ID")) {
          assetName = jsonData.onchain_metadata["asset ID"];
        }
        else if (jsonData.onchain_metadata.hasOwnProperty("name")) {
          assetName = jsonData.onchain_metadata["name"];
        }
        else if (jsonData.onchain_metadata.hasOwnProperty("Name")) {
          assetName = jsonData.onchain_metadata["Name"];
        }

        //TO DO: find more specific names if possible
        else if (jsonData.onchain_metadata.hasOwnProperty("Project")) {
          assetName = jsonData.onchain_metadata["Project"];
        }
        else if (jsonData.onchain_metadata.hasOwnProperty("Project Name")) {
          assetName = jsonData.onchain_metadata["Project Name"];
        }
        else {
          assetName = "No name found";
        }
      }
      //Add asset name to mint transaction
      mintTransactions[i].output_amount[j].name = assetName;
    }
  }

  //console.log(jsonData);
  return mintTransactions;
}

function formatTransactions(transactions) {
  const formattedTransactions = [];

  for (let i = 0; i < transactions.length; i++) {
    let names = [];
    const { block_time, hash } = transactions[i];
    for (let j = 1; j < transactions[i].output_amount.length; j++) {
      //console.log(transactions[i].output_amount[j].name);
      names.push(transactions[i].output_amount[j].name);
    }
    console.log(names);
    const formattedDate = new Date(block_time * 1000);
    formattedTransactions.push({
      block_time: formattedDate.toLocaleString(),
      hash: hash,
      name: names
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

async function fetchPaginatedData(url, wantedData) {
  let currentPage = 1;
  let allTransactions = [];
  let pageData = await fetchData(url + `?page=${currentPage}`, wantedData);
  while (pageData.length > 0) {
    allTransactions = allTransactions.concat(pageData);
    currentPage++;
    pageData = await fetchData(url + `?page=${currentPage}`, wantedData);
  }
  return allTransactions;
}

function updateAddressSection(address, transactions, mintTransactions) {
  //Stop svg
  const addressSection = document.getElementById("address-section");
  addressSection.classList.remove("hidden");
  const addressHeader = document.createElement("h2");
  addressHeader.innerText = "Address";
  addressHeader.classList.add("subheader-text");
  addressSection.appendChild(addressHeader);

  const newDiv = document.createElement("div");
  newDiv.classList.add("address");

  newDiv.innerHTML = `
    <div class="address-row">
      <p class="address-text">
        <a href = "https://cardanoscan.io/address/${address}" 
          target="_blank" class="cardanoScan-link">
        ${address}
        </a>
      </p>
    </div>
    <div class="address-row">
      <p class="address-label">Total Transactions:  </p>
      <p>${transactions.length}</p>
    </div>
    <div class="address-row">
      <p class="address-label">Mint Transactions:  </p>
      <p>${mintTransactions.length} </p>
    </div>
  `;
  addressSection.appendChild(newDiv);
}

function updateTransactionSection(transactions) {
  toggleAddressLoader();
  const transactionsSection = document.getElementById("transactions-section");
  transactionsSection.classList.remove("hidden");
  const transactionHeader = document.createElement("h2");
  transactionHeader.innerText = "Mint Transactions";
  transactionHeader.classList.add("subheader-text");
  transactionsSection.appendChild(transactionHeader);

  for (let i = 0; i < transactions.length; i++) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("transaction");

    let nameElement = '';
    console.log(transactions[i].name);
    for (let j = 0; j < transactions[i].name.length; j++) {
      nameElement += `
          <p>${transactions[i].name[j]}</p>
      `;
    }

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
        <div class="asset-row">
          ${nameElement}
        </div
      </div>
    `;

    transactionsSection.appendChild(newDiv);
  }
}
function updateError(error, address) {
  toggleAddressLoader();
  console.log(error);
  const errorSection = document.getElementById("error-section");
  errorSection.classList.remove("hidden");
  const errorHeader = document.createElement("h2");
  errorHeader.innerText = "Error";
  errorHeader.classList.add("subheader-text");
  errorHeader.classList.add("error");

  const errorText = document.createElement("p");
  errorText.innerText = error;
  errorText.classList.add("error-text");
  const addressText = document.createElement("p");
  addressText.innerText = address;
  addressText.classList.add("error-address-text");

  errorSection.appendChild(errorHeader);
  errorSection.appendChild(errorText);
  errorSection.appendChild(addressText);
}

function toggleAddressLoader() {
  const loader = document.getElementById("loader");
  loader.classList.contains("hidden") ? loader.classList.remove("hidden") : loader.classList.add("hidden");
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
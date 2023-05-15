
import { API_KEY } from './config.js';
import { MINT_TX_TEST, MULTIPLE_MINT_TX_TEST } from './tests/test.js';
import { LARGE_TX_TEST, LARGE_MINT_TX_TEST } from './tests/largeTest.js';
const ALL_TRANSACTION_STRING = "ALL TRANSACTIONS"
const MINT_STRING = "MINT TRANSACTIONS"
const ASSET_STRING = "SPECIFIC ASSET"
const UXTO_STRING = "UXTO"
function handleSubmit() {
  const searchBar = document.getElementById("search-bar");
  const searchBarValue = searchBar.value;

  //Spam 1: addr1qxyezkc02lpz0y8l587lhckpcjsed0v7wrjayut9alc75xkqgcy2x7t7d58zyt2rydep075va5xluwuqsdpssk60m4fqgccl75
  //Spam 2: addr1qydp5tjzex2xa87p8kz9hvm7e7mqj8wul28ylggvvrjf7n5sgq4a3gmwkf5ugalw6hgr8uvv4fk24mnl87hfcsx3pzjs3xkc73
  if (!searchBarValue.startsWith("addr")) {
    const location = window.location.href;
    updateSearchError(location);
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
  const mintTxWithName = await getSpecificAsset(transactions, address);
  setTimeout(() => {
    updateAddressSection(address, mintTransactions, mintTxWithName);
  }, 2000);

  //4. Format transactions 
  const formattedTransactions = formatTransactions(mintTxWithName);
  setTimeout(() => {
    updateTransactionSection(formattedTransactions);
  }, 4000);
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
async function getSpecificAsset(mintTransactions, address) {
  let assetName = "";
  let param = "";
  for (let i = 0; i < mintTransactions.length; i++) {
    //Check uxto mint 
    if (mintTransactions[i].asset_mint_or_burn_count > 5 || mintTransactions[i].output_amount.length > 2) {
      const uxtoData = await getUxtoData(mintTransactions[i], address);
      const newArray = mintTransactions[i].output_amount.filter((item) => {
        return uxtoData.includes(item.unit);
      })
      mintTransactions[i].output_amount = newArray;
    }
    for (let j = 1; j < mintTransactions[i].output_amount.length; j++) {
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

  return mintTransactions;
}

async function getUxtoData(mintTransaction, address) {
  const sentUnits = [];

  const uxtoData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${mintTransaction.hash}/utxos`, UXTO_STRING);
  const sentData = uxtoData.outputs.filter((item) => {
    return item.address === address;
  });

  for (let i = 0; i < sentData[0].amount.length; i++) {
    if (sentData[0].amount[i].unit === "lovelace") {
      sentUnits.push(sentData[0].amount[i].unit);
      continue;
    }
    const receivedFromUxto = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${sentData[0].amount[i].unit}`, ASSET_STRING);
    if (receivedFromUxto.initial_mint_tx_hash === mintTransaction.hash) {
      sentUnits.push(sentData[0].amount[i].unit);
    }
  };
  return sentUnits;
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
    const formattedDate = new Date(block_time * 1000);
    formattedTransactions.push({
      block_time: formattedDate.toLocaleString(),
      hash: hash,
      name: names
    });
  }
  return formattedTransactions;
}

function updateAddressSection(address, transactions, mintTransactions) {
  //Stop svg
  const addressSection = document.getElementById("address-section");
  const addressContainer = document.getElementById("address-container");
  const addressHeader = document.createElement("h2");
  addressSection.classList.remove("hidden");
  addressHeader.classList.add("subheader-text");
  addressHeader.innerText = "Address";
  addressContainer.appendChild(addressHeader);

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
  addressContainer.appendChild(newDiv);
}

function updateTransactionSection(transactions) {
  toggleAddressLoader();
  const transactionsSection = document.getElementById("transactions-section");
  const transactionsContainer = document.getElementById("transactions-container");
  const transactionHeader = document.createElement("h2");
  transactionsSection.classList.remove("hidden");
  transactionHeader.classList.add("subheader-text");
  transactionHeader.innerText = "Mint Transactions";
  transactionsContainer.appendChild(transactionHeader);

  for (let i = 0; i < transactions.length; i++) {
    const newDiv = document.createElement("div");
    newDiv.classList.add("transaction");

    let nameElement = '';
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

    transactionsContainer.appendChild(newDiv);
  }
}
function updateError(error, address) {
  toggleAddressLoader();
  console.log(error);
  const errorContainer = document.getElementById("error-container");
  const errorSection = document.getElementById("error-section");
  const errorHeader = document.createElement("h2");
  errorHeader.classList.add("subheader-text");
  errorHeader.classList.add("error");
  errorSection.classList.remove("hidden");
  errorHeader.innerText = "Error";

  const errorText = document.createElement("p");
  const addressText = document.createElement("p");
  errorText.classList.add("error-text");
  addressText.classList.add("error-address-text");
  errorText.innerText = error;
  addressText.innerText = address;

  errorContainer.appendChild(errorHeader);
  errorContainer.appendChild(errorText);
  errorContainer.appendChild(addressText);
}

function updateSearchError(location) {
  console.log(location);
  const errorModal = document.createElement("div");
  errorModal.classList.add("error-modal")
  location.includes("address.html") ? errorModal.classList.add("error-modal-address") : "";

  errorModal.innerHTML =
    `<p class="error-modal-text">
    <span class="error">Error:&nbsp</span> Address must begin with "addr1"</p>`;
  document.body.appendChild(errorModal);

  setTimeout(() => {
    errorModal.remove();
  }, 4000);
}

function toggleAddressLoader() {
  const loader = document.getElementById("loader");
  loader.classList.contains("hidden") ? loader.classList.remove("hidden") : loader.classList.add("hidden");
}


function handleInputChange(event, searchBarButton) {
  event.target.value ? searchBarButton.classList.remove("hidden") : searchBarButton.classList.add("hidden");
}

function addSearchEventListener() {
  const form = document.getElementById('search-form');
  const searchBar = document.getElementById('search-bar');
  const searchBarButton = document.getElementById("search-bar-delete");

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });

  searchBar.addEventListener('input', (event) => {
    handleInputChange(event, searchBarButton);
  });

  searchBarButton.addEventListener('click', function (event) {
    handleInputChange(event, searchBarButton);
    console.log(searchBar.value);
    searchBar.value = "";
  })
}

async function fetchData(url, wantedData) {
  //console.log("Fetching: ", wantedData)
  const response = await fetch(url, { headers: { 'project_id': `${API_KEY}` } })
  if (response.status != 200) {
    console.log(`Error fetching ${wantedData} transactions: `, response)
    return "";
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

addSearchEventListener();
loadAddress();
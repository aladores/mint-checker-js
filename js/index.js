
import { API_KEY } from './config.js';
import {
  displayAddressSection, displayTransactionSection,
  displayError, displaySearchError,
  toggleAddressLoader, handleInputChange
} from './display.js';
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
    displaySearchError(location);
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
    displayError("No transactions found in this address:", address);
    return;
  }

  //2. Find if any of those transactions are minted
  const mintTransactions = await getAllMintTransactions(transactions);
  if (mintTransactions.length === 0) {
    displayError("No mint transactions found in this address:", address);
    return;
  }

  //3. Find and replace output amount
  const mintTxWithName = await getSpecificAsset(mintTransactions, address);
  setTimeout(() => {
    displayAddressSection(address, transactions, mintTxWithName);
  }, 0);

  //4. Format transactions 
  const formattedTransactions = formatTransactions(mintTxWithName);
  setTimeout(() => {
    displayTransactionSection(formattedTransactions);
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
      const jsonAsset = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${param}`, ASSET_STRING);
      //Change to switch statement?
      if (jsonAsset.onchain_metadata !== null) {
        assetName = findName(jsonAsset.onchain_metadata);
      }
      //Add asset name to mint transaction
      mintTransactions[i].output_amount[j].name = assetName;
    }
  }

  return mintTransactions;
}

function findName(jsonAsset) {
  switch (true) {
    case jsonAsset.hasOwnProperty("asset_ID"):
      return jsonAsset["asset ID"];
    case jsonAsset.hasOwnProperty("name"):
      return jsonAsset["name"];
    case jsonAsset.hasOwnProperty("Name"):
      return jsonAsset["Name"];
    case jsonAsset.hasOwnProperty("Project"):
      return jsonAsset["Project"];
    case jsonAsset.hasOwnProperty("Project Name"):
      return jsonAsset["Project Name"];
    default:
      return "No name found";
  }

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
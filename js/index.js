

import { fetchData, fetchPaginatedData } from './util.js';
import {
  displayAddressSection, displayTransactionSection,
  displayError, displaySearchError,
  toggleAddressLoader, handleInputChange
} from './display.js';

const ALL_TRANSACTION_STRING = "ALL TRANSACTIONS"
const MINT_STRING = "MINT TRANSACTIONS"
const ASSET_STRING = "SPECIFIC ASSET"
const UXTO_STRING = "UXTO"

function handleSubmit() {
  const dateRange = document.getElementById("date-range");
  const searchBar = document.getElementById("search-bar");

  if (!searchBar.value.startsWith("addr")) {
    const location = window.location.href;
    displaySearchError(location);
    return;
  }
  window.location = "address.html" + `?addr=${searchBar.value}` + `&date=${dateRange.value}`;
}

function loadAddress() {
  const urlSearchParams = new URLSearchParams(window.location.search);

  if (urlSearchParams.has("addr")) {
    const formData = Object.fromEntries(urlSearchParams.entries());
    updateDom(formData.addr, formData.date);
  }
}

async function updateDom(address, date) {
  toggleAddressLoader();

  const transactions = await getAllTransactions(address, date);
  if (transactions.length === 0) {
    displayError("No transactions found in this address:", address);
    return;
  }

  const mintTransactions = await getAllMintTransactions(transactions);
  if (mintTransactions.length === 0) {
    displayError("No mint transactions found in this address:", address);
    return;
  }

  const mintTxWithName = await getSpecificAsset(mintTransactions, address);

  setTimeout(() => {
    displayAddressSection(address, transactions, mintTxWithName, date);
  }, 0);

  const formattedTransactions = formatTransactions(mintTxWithName);
  setTimeout(() => {
    displayTransactionSection(formattedTransactions);
  }, 2000);
}

async function getAllTransactions(address, date) {
  const jsonData = await fetchPaginatedData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/transactions`, ALL_TRANSACTION_STRING);
  const transactions = [];

  for (let i = 0; i < jsonData.length; i++) {
    if (date === "All") {
      transactions.push(jsonData[i].tx_hash);
    }
    else {
      const formattedDate = new Date(jsonData[i].block_time * 1000);
      if (formattedDate.getFullYear() === parseInt(date)) {
        transactions.push(jsonData[i].tx_hash);
      }
    }
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
      if (jsonAsset.onchain_metadata !== null) {
        assetName = findName(jsonAsset.onchain_metadata);
      }
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
  const themeButton = document.getElementById("theme-button");

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });

  searchBar.addEventListener('input', (event) => {
    handleInputChange(event, searchBarButton);
  });

  searchBarButton.addEventListener('click', function (event) {
    handleInputChange(event, searchBarButton);
    searchBar.value = "";
  })

  themeButton.addEventListener('click', (event) => {
    document.body.classList.toggle("light-mode");
    setColorTheme();
  });
}

function setColorTheme() {
  const themeButtonImage = document.getElementById("theme-button-image");
  const titleLogo = document.getElementById("title-logo");
  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem('isLightMode', true);
    themeButtonImage.src = "./images/sun-icon.png";
    titleLogo.src = "./images/cardano-logo-black.png";
    return;
  }
  localStorage.setItem('isLightMode', false);
  themeButtonImage.src = "./images/moon-icon.png";
  titleLogo.src = "./images/cardano-logo.png";
}

function setInitialColorTheme() {
  localStorage.getItem('isLightMode') === "true"
    ? document.body.classList.add("light-mode")
    : document.body.classList.remove("light-mode");
  setColorTheme();
}
setInitialColorTheme();
addSearchEventListener();
loadAddress();
import {
  displayAddressSection, displayTransactionSection,
  updateAddressSectionTx, updateAddressSectionMint, toggleLoader,
  displayError, displaySearchError, handleInputChange
} from './display.js';

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

  displayAddressSection(address, date);
  const transactions = await getAllTransactions(address, date);
  if (transactions.length === 0) {
    displayError("No transactions found in this address:", address);
    return;
  }
  updateAddressSectionTx(transactions);

  const mintTransactions = await getAllMintTransactions(transactions);
  if (mintTransactions.length === 0) {
    displayError("No mint transactions found in this address:", address);
    return;
  }

  updateAddressSectionMint(mintTransactions);

  toggleLoader();
  const mintTxWithName = await getSpecificAsset(mintTransactions, address);
  const formattedTransactions = formatTransactions(mintTxWithName);
  displayTransactionSection(formattedTransactions);
}

async function getAllTransactions(address, date) {
  const transactions = [];
  const result = await fetch(`/api/transactions?address=${address}`);
  const jsonData = await result.json();

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
    const result = await fetch(`/api/specificTransactions?transaction=${transactions[i]}`);
    const jsonData = await result.json();
    if (jsonData.asset_mint_or_burn_count > 0) {
      mintTransactions.push(jsonData);
    }
  }
  return mintTransactions;
}

async function getSpecificAsset(mintTransactions, address) {
  for (let i = 0; i < mintTransactions.length; i++) {
    //Check uxto mint 
    if (mintTransactions[i].asset_mint_or_burn_count > 5 || mintTransactions[i].output_amount.length > 2) {
      const uxtoData = await getUxtoData(mintTransactions[i], address);
      const newArray = mintTransactions[i].output_amount.filter((item) => {
        return uxtoData.includes(item.unit);
      })
      mintTransactions[i].output_amount = newArray;
    }

    console.log(mintTransactions[i]);
    for (let j = 1; j < mintTransactions[i].output_amount.length; j++) {
      const asset = mintTransactions[i].output_amount[j].unit;
      const result = await fetch(`/api/specificAsset?asset=${asset}`);
      const jsonAsset = await result.json();
      if (jsonAsset.onchain_metadata !== null) {
        const assetName = findName(jsonAsset.onchain_metadata);
        mintTransactions[i].output_amount[j].name = assetName;
      }
    }
  }

  return mintTransactions;
}

async function getUxtoData(mintTransaction, address) {
  const sentUnits = [];
  const result = await fetch(`/api/uxto?mintTransaction=${mintTransaction.hash}`);
  const uxtoData = await result.json();
  const sentData = uxtoData.outputs.filter((item) => {
    return item.address === address;
  });

  for (let i = 0; i < sentData[0].amount.length; i++) {
    if (sentData[0].amount[i].unit === "lovelace") {
      sentUnits.push(sentData[0].amount[i].unit);
      continue;
    }

    const resultUxto = await fetch(`/api/uxtoReceived?asset=${sentData[0].amount[i].unit}`);
    const receivedUxtoData = await resultUxto.json();
    if (receivedUxtoData.initial_mint_tx_hash === mintTransaction.hash) {
      sentUnits.push(sentData[0].amount[i].unit);
    }
  };
  return sentUnits;
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

function formatTransactions(transactions) {
  console.log(transactions);
  const formattedTransactions = [];

  for (let i = 0; i < transactions.length; i++) {
    let names = [];
    const { block_time, hash } = transactions[i];
    //Skip if lovelace only
    if (transactions[i].output_amount.length == 1) {
      continue;
    }
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
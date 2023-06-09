export function displayAddressSection(address, date) {
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
    <div class="info-row">
      <p class="address-text">
        <a href = "https://cardanoscan.io/address/${address}" 
          target="_blank" class="cardanoScan-link">
        ${address}
        </a>
      </p>
    </div>
    <div class="info-row">
      <p class="large-label">Date Range:  </p>
      <p>${date.toString()}</p>
    </div>
    <div class="info-row">
      <p class="large-label">Total Transactions:  </p>
      <p id="address-transactions"></p>
      <div id="address-loader" class="inline-loader"></div>
  </div>
  `;
  addressContainer.appendChild(newDiv);
};
export function updateAddressSectionTx(transactions) {
  removeInlineLoader();
  const addressContainer = document.getElementById("address-container");
  const addressTransactions = document.getElementById("address-transactions");

  addressTransactions.innerHTML += `<p>${transactions.length}</p>`;

  addressContainer.innerHTML += `
   <div class="info-row">
      <p class="large-label">Mint Transactions:  </p>
      <p id="address-mint-transactions"></p>
      <div id="address-loader" class="inline-loader"></div>
    </div>
  `;
}

export function updateAddressSectionMint(mintTransactions) {
  removeInlineLoader();
  const addressMintTransactions = document.getElementById("address-mint-transactions");
  addressMintTransactions.innerHTML += `<p>${mintTransactions.length}</p>`;
}

export function displayTransactionSection(transactions) {
  toggleLoader();
  const transactionsSection = document.getElementById("transactions-section");
  const paginationContainer = document.getElementById("pagination-container");
  transactionsSection.classList.remove("hidden");
  const nextButton = transactionsSection.querySelector('#next-button');
  const prevButton = transactionsSection.querySelector('#prev-button');

  const limitPerPage = 5;
  const pageLimit = Math.ceil(transactions.length / limitPerPage);
  let currentPage = 1;
  let pageStart = 0;
  let pageEnd = 5;

  const downloadButton = transactionsSection.querySelector('#download-button');
  downloadButton.addEventListener("click", () => {
    handleCSVDownload(transactions, "mint-transactions");
  })

  //Pagination 
  if (transactions.length > limitPerPage) {
    prevButton.disabled = true;

    const updatePagination = () => {
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === pageLimit;
      renderTransactions(transactions, paginationContainer, pageStart, pageEnd, currentPage, pageLimit);
    };

    nextButton.addEventListener('click', () => {
      currentPage++;
      pageStart += limitPerPage;
      pageEnd += limitPerPage;
      updatePagination();
    });
    prevButton.addEventListener('click', () => {
      currentPage--;
      pageStart -= limitPerPage;
      pageEnd -= limitPerPage;
      updatePagination();
    });
  }
  else {
    prevButton.disabled = true;
    nextButton.disabled = true;
  }
  renderTransactions(transactions, paginationContainer, pageStart, pageEnd, currentPage, pageLimit);
}

function renderTransactions(transactions, paginationContainer, pageStart, pageEnd, currentPage, pageLimit) {
  const label = document.getElementById("pagination-label");
  label.innerHTML = `Page ${currentPage} of ${pageLimit}`;
  paginationContainer.innerHTML = "";
  for (let i = pageStart; i < pageEnd; i++) {

    const newDiv = document.createElement("div");
    newDiv.classList.add("transaction");

    let nameElement = '';
    for (let j = 0; j < transactions[i].name.length; j++) {
      nameElement += `
          <p>${transactions[i].name[j]}</p>
      `;
    }

    newDiv.innerHTML = `
      <div class="info-row">
        <p class="small-label no-shrink">Transaction id: </p>
        <p>
          <a href = "https://cardanoscan.io/transaction/${transactions[i].hash}" 
            target="_blank" class="cardanoScan-link">
            ${transactions[i].hash}
          </a>
        </p>
      </div>
      <div class="info-row">
        <p  class="small-label no-shrink"> Received time: </p>
        <p> ${transactions[i].block_time}</p>
      </div>
      <div class="info-row">
        <p  class="small-label no-shrink"> Asset name: </p>
        <div class="asset-row">
          ${nameElement}
        </div
      </div>
    `;

    paginationContainer.appendChild(newDiv);
    if (transactions[i + 1] === undefined) {
      break;
    }
  }
}
export function displayError(error, address) {
  console.log(error);
  const addressSection = document.getElementById("address-section");
  const transactionSection = document.getElementById("transactions-section");

  addressSection.classList.add("hidden");
  transactionSection.classList.add("hidden");

  const errorSection = document.getElementById("error-section");
  errorSection.classList.remove("hidden");

  const errorContainer = document.getElementById("error-container");

  errorContainer.innerHTML += `
    <p class="error-text">${error}</p>
    <p class="error-address-text">${address}</p>`;
}

export function displaySearchError(location) {
  const searchBar = document.getElementById("search-bar");
  const searchError = document.getElementById("search-error");

  searchError.classList.remove("no-visibility");
  searchBar.focus();
  searchBar.classList.add("search-bar-error");
}

export function handleInputChange(event, searchBarButton) {
  removeSearchError();
  event.target.value ? searchBarButton.classList.remove("hidden") : searchBarButton.classList.add("hidden");
}

export function toggleLoader() {
  const loader = document.getElementById("loader");
  loader.classList.contains("hidden") ? loader.classList.remove("hidden") : loader.classList.add("hidden");
}

export function handleCSVDownload(data, fileName) {
  const csvData = convertToCSV(data);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // For IE 10+
    navigator.msSaveBlob(blob, fileName);
  } else {
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function removeSearchError() {
  const searchBar = document.getElementById("search-bar");
  const searchError = document.getElementById("search-error");
  searchError.classList.add("no-visibility");
  searchBar.classList.remove("search-bar-error");

}
function removeInlineLoader() {
  const loader = document.getElementById("address-loader");
  loader.remove();
}


function convertToCSV(data) {
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));

  data.forEach(element => {
    const values = Object.values(element)
      .map((value) => `"${value}"`)
      .join(',');
    csvRows.push(values);
  });
  return csvRows.join('\n')
}

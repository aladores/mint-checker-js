import { downloadCSV } from './util.js';
export function displayAddressSection(address, transactions, mintTransactions) {
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

export function displayTransactionSection(transactions) {
  toggleAddressLoader();
  const transactionsSection = document.getElementById("transactions-section");
  const paginationContainer = document.getElementById("pagination-container");
  transactionsSection.classList.remove("hidden");

  const limitPerPage = 5;
  const pageLimit = Math.ceil(transactions.length / limitPerPage);
  console.log(pageLimit);
  let currentPage = 1;
  let pageStart = 0;
  let pageEnd = 5;

  //Download CSV 
  const downloadButton = transactionsSection.querySelector('#download-button');
  downloadButton.addEventListener("click", () => {
    downloadCSV(transactions, "mint-transactions");
  })

  //Pagination 
  if (transactions.length > limitPerPage) {
    const nextButton = transactionsSection.querySelector('#next-button');
    const prevButton = transactionsSection.querySelector('#prev-button');

    prevButton.disabled = true;

    const updatePagination = () => {
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === pageLimit;

      renderTransactions(transactions, paginationContainer, pageStart, pageEnd, currentPage, pageLimit);
    };

    const handleNextButtonClick = () => {
      currentPage++;
      pageStart += limitPerPage;
      pageEnd += limitPerPage;
      updatePagination();
    };

    const handlePrevButtonClick = () => {
      currentPage--;
      pageStart -= limitPerPage;
      pageEnd -= limitPerPage;
      updatePagination();
    };

    nextButton.addEventListener('click', handleNextButtonClick);
    prevButton.addEventListener('click', handlePrevButtonClick);
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

    paginationContainer.appendChild(newDiv);
    if (transactions[i + 1] === undefined) {
      break;
    }
  }
}
export function displayError(error, address) {
  toggleAddressLoader();
  console.log(error);
  errorSection.classList.remove("hidden");
  const errorContainer = document.getElementById("error-container");
  const errorSection = document.getElementById("error-section");

  const errorText = document.createElement("p");
  const addressText = document.createElement("p");
  errorText.classList.add("error-text");
  addressText.classList.add("error-address-text");
  errorText.innerText = error;
  addressText.innerText = address;

  errorContainer.appendChild(errorText);
  errorContainer.appendChild(addressText);
}

export function displaySearchError(location) {
  const errorModal = document.createElement("div");
  errorModal.classList.add("error-modal")
  location.includes("address.html") ? errorModal.classList.add("error-modal-address") : "";

  errorModal.innerHTML =
    `<p class="error-modal-text">
      <span class="error">Error:&nbsp</span> 
      Address must begin with "addr1"</p>`;
  document.body.appendChild(errorModal);

  setTimeout(() => {
    errorModal.remove();
  }, 4000);
}

export function toggleAddressLoader() {
  const loader = document.getElementById("loader");
  loader.classList.contains("hidden") ? loader.classList.remove("hidden") : loader.classList.add("hidden");
}

export function handleInputChange(event, searchBarButton) {
  event.target.value ? searchBarButton.classList.remove("hidden") : searchBarButton.classList.add("hidden");
}
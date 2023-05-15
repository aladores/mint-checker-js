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
export function displayError(error, address) {
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

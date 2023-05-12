
import { API_KEY } from './config.js';

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
    //Update address header
    const addressHeader = document.getElementById("address-header");
    addressHeader.innerHTML = formData.addr;

    test();
  }
}

async function test() {
  const url = "https://cardano-mainnet.blockfrost.io/api/v0/health"
  console.log(API_KEY);
  const response = await fetch(url, { headers: { 'project_id': `${API_KEY}` } })
  const jsonData = await response.json();
  console.log(jsonData);
}

function addEventListener() {
  const form = document.querySelector('form');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSubmit();
  });
}

console.log("Hello");

addEventListener();
loadAddress();
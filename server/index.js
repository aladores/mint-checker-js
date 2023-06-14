
const express = require('express');
const path = require('path');
const app = express();
const fetch = require("node-fetch");

require('dotenv').config();
const port = process.env.PORT;
const API_KEY = process.env.API_KEY;
const clientPath = path.join(__dirname, '../client');

app.use(express.static(clientPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(clientPath, '/index.html'));
})

app.get("/address.html", (req, res) => {
    res.sendFile(path.join(clientPath, '/address.html'));
})

app.get('/api/transactions', async (req, res) => {
    console.log("calling api test");
    const address = req.query.address;
    const transactions = await fetchPaginatedData(`https://cardano-mainnet.blockfrost.io/api/v0/addresses/${address}/transactions`, 'ALL_TRANSACTIONS');
    res.json(transactions);
});

app.get('/api/specificTransactions', async (req, res) => {
    const transaction = req.query.transaction;
    const specificTransaction = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${transaction}`, 'SPECIFIC_TRANSACTIONS');
    res.json(specificTransaction);
});

app.get('/api/uxto', async (req, res) => {
    const mintTransaction = req.query.mintTransaction;
    const uxtoData = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/txs/${mintTransaction}/utxos`, 'UXTO_DATA');
    res.json(uxtoData);
});

app.get('/api/uxtoReceived', async (req, res) => {
    const asset = req.query.asset;
    const uxtoReceived = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${asset}`, 'UXTO_RECEIVED');
    res.json(uxtoReceived);
});
app.get('/api/specificAsset', async (req, res) => {
    const asset = req.query.asset;
    const specificAsset = await fetchData(`https://cardano-mainnet.blockfrost.io/api/v0/assets/${asset}`, 'SPECIFIC_ASSET');
    res.json(specificAsset);
});

app.get('*', function (req, res) {
    res.redirect('/');
});

async function fetchData(url, wantedData) {
    //console.log("Fetching: ", wantedData);
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
const express = require('express');
//const { fetchData, fetchPaginatedData } = require('./utils/api');
const path = require('path');
const app = express();
require('dotenv').config();


const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(clientPath, '/public/index.html'));
})

app.get("/address.html", (req, res) => {
    res.sendFile(path.join(clientPath, '/public/address.html'));
})

app.get('*', function (req, res) {
    res.redirect('/');
});


const API_KEY = process.env.API_KEY;

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


const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
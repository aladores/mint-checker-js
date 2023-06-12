
const API_KEY = process.env.API_KEY;
export async function fetchData(url, wantedData) {
    //console.log("Fetching: ", wantedData)
    const response = await fetch(url, { headers: { 'project_id': `${API_KEY}` } })
    if (response.status != 200) {
        console.log(`Error fetching ${wantedData} transactions: `, response)
        return "";
    }
    const jsonData = await response.json();
    return jsonData;
}

export async function fetchPaginatedData(url, wantedData) {
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


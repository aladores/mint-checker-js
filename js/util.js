
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

export function downloadCSV(data, fileName) {
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

function convertToCSV(data) {
    //console.log(data);
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    data.forEach(element => {
        const values = Object.values(element).join(',');
        csvRows.push(values);
    });
    return csvRows.join('\n')
}

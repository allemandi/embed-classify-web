// const fs = require ("fs");
const csv = require('csvtojson');
const path = require('path');

const loadCsv = async (filePath) => {
  const csvFile = path.resolve(filePath);
  const csvData = await csv().fromFile(csvFile);
  return csvData;
};

const prepareCsvEmbedding = async (filePath, categoryHeader, commentHeader) => {
  const csvData = await loadCsv(filePath);
  //filter against original csv, skipping whole rows in case of any null values
  const filteredData = csvData.filter(
    (i) => i[categoryHeader] && i[commentHeader]
  );
  const sortedData = filteredData.sort((a, b) =>
    a[categoryHeader].localeCompare(b[categoryHeader])
  );
  return sortedData;
};

module.exports = {
  loadCsv,
  prepareCsvEmbedding,
};

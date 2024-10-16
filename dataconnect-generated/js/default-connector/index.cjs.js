const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'litrix',
  location: 'europe-west3'
};
exports.connectorConfig = connectorConfig;


const sleep = (ms = 1500) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = sleep;

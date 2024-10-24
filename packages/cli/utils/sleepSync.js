const sleepSync = (ms = 1500) => {
    const start = Date.now();
    while (Date.now() < start + ms) {
        // Do nothing.
    }
};

module.exports = sleepSync;

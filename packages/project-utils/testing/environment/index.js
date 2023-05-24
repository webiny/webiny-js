const getStorageOps = app => {
    const storageOps = global["__storageOps"];

    if (typeof storageOps === "undefined") {
        throw new Error(`Storage ops are not configured!`);
    }

    const appStorageOps = storageOps[app];
    if (typeof appStorageOps === "undefined") {
        throw new Error(
            `Storage ops for "${app}" are not configured! Have you configured "jest.setup.js" correctly?`
        );
    }

    return appStorageOps();
};

const setStorageOps = (app, factory) => {
    const storageOps = global["__storageOps"] || {};
    storageOps[app] = factory;
    global["__storageOps"] = storageOps;
};

const clearStorageOps = () => {
    delete global["__storageOps"];
};

module.exports = { setStorageOps, getStorageOps, clearStorageOps };

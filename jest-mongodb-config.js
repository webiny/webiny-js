module.exports = {
    mongodbMemoryServerOptions: {
        instance: {
            dbName: "jest",
            port: 27018
        },
        binary: {
            version: "4.0.7",
            skipMD5: true
        },
        autoStart: false
    }
};
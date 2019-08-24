const { MongoClient } = require("mongodb");
const migrate = require("./migrate");

const host = "localhost:27018";
const dbName = "webinyjs";

(async () => {
    const client = await MongoClient.connect("mongodb://" + host, { useNewUrlParser: true });

    const dbInstance = client.db(dbName);
    try {
        await migrate(dbInstance, { host, dbName });
    } catch (e) {
        console.log(e);
    }

    process.exit();
})();

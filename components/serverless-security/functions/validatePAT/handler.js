const { MongoClient } = require("mongodb");

module.exports.handler = async event => {
    async function getDatabase() {
        const client = await MongoClient.connect(process.env.MONGODB_SERVER, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            serverSelectionTimeoutMS: 10000
        });

        return client.db(process.env.MONGODB_NAME);
    }

    console.log("Received event...");
    console.log(event);
    const db = await getDatabase();

    const { token } = event.PAT;
    const user = await db
        .collection("SecurityUser")
        .findOne(
            { personalAccessTokens: { $elemMatch: { token } } },
            { projection: { _id: 0, id: 1 } }
        );
    if (user) {
        user.type = "user";
    }

    console.log("user = ");
    console.log(user);

    return user;
};

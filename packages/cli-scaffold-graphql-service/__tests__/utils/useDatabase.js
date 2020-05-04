import { MongoClient } from "mongodb";

export default utilsId => ({ init } = {}) => {
    const self = {
        db: null,
        connection: null,
        getDatabase() {
            return self.db;
        },
        getConnection() {
            return self.connection;
        },
        getCollection(name) {
            const collection = self.getDatabase().collection(name);
            const __find = collection.find.bind(collection);
            collection.find = (...args) => {
                const cursor = __find(...args);
                cursor.toSimpleArray = async () => {
                    const array = await cursor.toArray();
                    return array.map(item => {
                        const output = {};
                        const keys = Object.keys(item);
                        for (let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            output[key] = item[key];
                        }

                        if (typeof output._id !== "undefined") {
                            output._id = String(output._id);
                        }
                        return output;
                    });
                };
                return cursor;
            };

            return collection;
        },
        beforeAll: async () => {
            self.connection = await MongoClient.connect(global.__MONGO_URI__, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            self.db = await self.connection.db(global.__MONGO_DB_NAME__ + "_" + utilsId);
            self.getDatabase().dropDatabase();
        },
        afterAll: async () => {
            await self.getConnection().close();
            await self.getDatabase().close();
        }
    };

    if (init === false) {
        return self;
    }

    beforeAll(async () => {
        await self.beforeAll();
    });
    afterAll(async () => {
        await self.afterAll();
    });

    return self;
};

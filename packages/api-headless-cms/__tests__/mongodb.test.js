import mongoDb from "@webiny/api-plugin-commodo-mongodb";
import i18n from "@webiny/api-i18n/plugins/service";
import mockI18NLocales from "./mocks/mockI18NLocales";
import graphqlTests from "./tests/graphql";
import toModelTests from "./tests/toModel";
import contentModelTests from "./tests/contentModel";

const callbacks = {
    afterAll: []
};

const testCallbacks = {
    afterAll(cb) {
        callbacks.afterAll.push(cb);
    }
};

const mongoDbPlugins = mongoDb({
    database: {
        server: global.__MONGO_URI__,
        name: global.__MONGO_DB_NAME__
    },
    test: testCallbacks
});

const plugins = [mongoDbPlugins, i18n(), mockI18NLocales()];

describe("MongoDB Headless CMS API", () => {
    afterAll(async () => await Promise.all(callbacks.afterAll.map(cb => cb())));
    graphqlTests({ plugins });
    //toModelTests({ plugins });
    //contentModelTests({ plugins });
});

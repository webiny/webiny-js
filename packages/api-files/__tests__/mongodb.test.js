var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoDb from "@webiny/api-plugin-commodo-mongodb";
import mongoDbResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import runTests from "./graphql";
const callbacks = {
    afterAll: []
};
const testCallbacks = {
    afterAll(cb) {
        callbacks.afterAll.push(cb);
    }
};
describe("MongoDB Files API", () => {
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () { return yield Promise.all(callbacks.afterAll.map(cb => cb())); }));
    runTests({
        plugins: [
            mongoDb({
                database: {
                    // @ts-ignore
                    server: global.__MONGO_URI__,
                    // @ts-ignore
                    name: global.__MONGO_DB_NAME__
                },
                test: testCallbacks
            }),
            mongoDbResolvers()
        ]
    });
});

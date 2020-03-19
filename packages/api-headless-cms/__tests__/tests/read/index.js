import contentModelToSDL from "./contentModelToSDL";
import schema from "./graphqlSchema";
import resolvers from "./resolvers";
import headlessPlugins from "../../../src/handler/plugins";
import { setupSchema as setupTestingSchema } from "@webiny/api/testing";

export default ({ plugins }) => {
    function setupSchema() {
        return setupTestingSchema([
            plugins,
            headlessPlugins({ type: "read", environment: "default" })
        ]);
    }

    describe("READ API", () => {
        contentModelToSDL({ plugins });
        schema({ setupSchema });
        resolvers({ setupSchema });
    });
};

import { setupSchema as setupTestingSchema } from "@webiny/api/testing";
import contentModelToSDL from "./contentModelToSDL";
import schema from "./graphqlSchema";
import resolvers from "./resolvers";
import headlessPlugins from "../../../src/plugins";

export default ({ plugins }) => {
    function setupSchema() {
        return setupTestingSchema([
            plugins,
            headlessPlugins({ type: "manage", environment: "default" })
        ]);
    }

    describe("MANAGE API", () => {
        contentModelToSDL({ plugins });
        schema({ setupSchema });
        resolvers({ setupSchema });
    });
};

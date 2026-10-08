import { createFeature } from "@webiny/feature/admin";
import { Banners as BannersAbstraction } from "./abstractions.js";
import { Banners } from "./Banners.js";

export const BannersFeature = createFeature({
    name: "Banners",
    register(container) {
        container.register(Banners).inSingletonScope();
    },
    resolve(container) {
        return {
            banners: container.resolve(BannersAbstraction)
        };
    }
});

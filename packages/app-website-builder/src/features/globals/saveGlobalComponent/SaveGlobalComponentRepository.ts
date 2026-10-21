import type { GlobalComponentRecord } from "@webiny/website-builder-sdk";
import {
    SaveGlobalComponentRepository as RepositoryAbstraction,
    SaveGlobalComponentGateway
} from "./abstractions.js";

/**
 * Pages are cached as stored, without their global components: the page editor adds the globals' current
 * records when it opens a page, so cached pages need no update.
 */
class SaveGlobalComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: SaveGlobalComponentGateway.Interface) {}

    async execute(globalComponent: GlobalComponentRecord) {
        return await this.gateway.execute(globalComponent);
    }
}

export const SaveGlobalComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: SaveGlobalComponentRepositoryImpl,
    dependencies: [SaveGlobalComponentGateway]
});

import {
    DeletePageRevisionGateway,
    DeletePageRevisionRepository as RepositoryAbstraction
} from "./abstractions.js";
import type { Page } from "~/domain/Page/Page.js";

class DeletePageRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private readonly gateway: DeletePageRevisionGateway.Interface) {}

    async execute(page: Page, permanently = false) {
        await this.gateway.execute(page.id, permanently);
    }
}

export const DeletePageRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeletePageRevisionRepositoryImpl,
    dependencies: [DeletePageRevisionGateway]
});

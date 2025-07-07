import pick from "lodash/pick";
import type { IDuplicatePage } from "./IDuplicatePage";
import type { DuplicateWbPageParams, WbPage, WbPagesStorageOperations } from "~/page/page.types";

export class DuplicatePage implements IDuplicatePage {
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly createOperation: WbPagesStorageOperations["create"];

    constructor(
        getOperation: WbPagesStorageOperations["get"],
        createOperation: WbPagesStorageOperations["create"]
    ) {
        this.getOperation = getOperation;
        this.createOperation = createOperation;
    }

    async execute({ id }: DuplicateWbPageParams): Promise<WbPage> {
        const page = await this.getOperation({ id });

        if (!page) {
            throw new Error(`Page with id ${id} not found`);
        }

        const data = this.pickPageData(page);

        const newPage = {
            ...data,
            properties: {
                ...data.properties,
                title: "Copy of " + page.properties.title
            }
        };

        return await this.createOperation({ data: newPage });
    }

    private pickPageData = (page: WbPage) => {
        return pick(page, ["bindings", "elements", "wbyAco_location", "properties", "metadata"]);
    };
}

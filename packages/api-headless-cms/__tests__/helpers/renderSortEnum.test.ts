import { beforeEach, describe, expect, it } from "vitest";
import models from "../contentAPI/mocks/contentModels";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { useHandler } from "~tests/testHelpers/useHandler";
import type { CmsModel } from "~/types";
import {
    CmsGraphQLSchemaSorter,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

const testSorter = CmsGraphQLSchemaSorter.createImplementation({
    implementation: class TestSorter implements CmsGraphQLSchemaSorter.Interface {
        execute({ sorters }: CmsGraphQLSchemaSorter.Params) {
            return [...sorters, `testSorter_ASC`, `testSorter_DESC`];
        }
    },
    dependencies: []
});

describe("Render GraphQL sort enum", () => {
    let fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    let sorters: CmsGraphQLSchemaSorter.Interface[];

    beforeEach(async () => {
        const { handler, tenant } = useHandler({});
        const context = await handler({
            path: "/cms/manage",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });
        context.container.register(testSorter);
        fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);
        sorters = context.container.resolveAll(CmsGraphQLSchemaSorter);
    });

    it("should render non-deleted fields sorts - read API", () => {
        const model = models.find(model => model.modelId === "product") as CmsModel;

        const result = renderSortEnum({
            model,
            fields: model.fields,
            fieldRegistry,
            sorters
        });

        expect(result).toEqual(
            [
                "id_ASC",
                "id_DESC",
                "createdOn_ASC",
                "createdOn_DESC",
                "modifiedOn_ASC",
                "modifiedOn_DESC",
                "savedOn_ASC",
                "savedOn_DESC",
                "deletedOn_ASC",
                "deletedOn_DESC",
                "restoredOn_ASC",
                "restoredOn_DESC",
                "firstPublishedOn_ASC",
                "firstPublishedOn_DESC",
                "lastPublishedOn_ASC",
                "lastPublishedOn_DESC",
                "revisionCreatedOn_ASC",
                "revisionCreatedOn_DESC",
                "revisionModifiedOn_ASC",
                "revisionModifiedOn_DESC",
                "revisionSavedOn_ASC",
                "revisionSavedOn_DESC",
                "revisionDeletedOn_ASC",
                "revisionDeletedOn_DESC",
                "revisionRestoredOn_ASC",
                "revisionRestoredOn_DESC",
                "revisionFirstPublishedOn_ASC",
                "revisionFirstPublishedOn_DESC",
                "revisionLastPublishedOn_ASC",
                "revisionLastPublishedOn_DESC",
                "values_title_ASC",
                "values_title_DESC",
                "values_price_ASC",
                "values_price_DESC",
                "values_inStock_ASC",
                "values_inStock_DESC",
                "values_itemsInStock_ASC",
                "values_itemsInStock_DESC",
                "values_availableOn_ASC",
                "values_availableOn_DESC",
                "values_color_ASC",
                "values_color_DESC",
                "values_availableSizes_ASC",
                "values_availableSizes_DESC",
                "testSorter_ASC",
                "testSorter_DESC"
            ].join("\n")
        );
    });

    it("should render non-deleted fields sorts - manage API", () => {
        const model = models.find(model => model.modelId === "product") as CmsModel;

        const result = renderSortEnum({
            model,
            fields: model.fields,
            fieldRegistry,
            sorters
        });

        expect(result).toEqual(
            [
                "id_ASC",
                "id_DESC",
                "createdOn_ASC",
                "createdOn_DESC",
                "modifiedOn_ASC",
                "modifiedOn_DESC",
                "savedOn_ASC",
                "savedOn_DESC",
                "deletedOn_ASC",
                "deletedOn_DESC",
                "restoredOn_ASC",
                "restoredOn_DESC",
                "firstPublishedOn_ASC",
                "firstPublishedOn_DESC",
                "lastPublishedOn_ASC",
                "lastPublishedOn_DESC",
                "revisionCreatedOn_ASC",
                "revisionCreatedOn_DESC",
                "revisionModifiedOn_ASC",
                "revisionModifiedOn_DESC",
                "revisionSavedOn_ASC",
                "revisionSavedOn_DESC",
                "revisionDeletedOn_ASC",
                "revisionDeletedOn_DESC",
                "revisionRestoredOn_ASC",
                "revisionRestoredOn_DESC",
                "revisionFirstPublishedOn_ASC",
                "revisionFirstPublishedOn_DESC",
                "revisionLastPublishedOn_ASC",
                "revisionLastPublishedOn_DESC",
                "values_title_ASC",
                "values_title_DESC",
                "values_price_ASC",
                "values_price_DESC",
                "values_inStock_ASC",
                "values_inStock_DESC",
                "values_itemsInStock_ASC",
                "values_itemsInStock_DESC",
                "values_availableOn_ASC",
                "values_availableOn_DESC",
                "values_color_ASC",
                "values_color_DESC",
                "values_availableSizes_ASC",
                "values_availableSizes_DESC",
                "testSorter_ASC",
                "testSorter_DESC"
            ].join("\n")
        );
    });
});

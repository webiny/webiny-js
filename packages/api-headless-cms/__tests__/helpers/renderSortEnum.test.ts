import models from "../contentAPI/mocks/contentModels";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsFieldTypePlugins, CmsModel, CmsModelFieldToGraphQLPlugin } from "~/types";
import { createCmsGraphQLSchemaSorterPlugin } from "~/plugins";

const sortPlugin = createCmsGraphQLSchemaSorterPlugin(({ sorters }) => {
    return [...sorters, "testSorter_ASC", "testSorter_DESC"];
});

describe("Render GraphQL sort enum", () => {
    const { plugins } = useGraphQLHandler();

    const fieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce<CmsFieldTypePlugins>((collection, plugin) => {
            collection[plugin.fieldType] = plugin;
            return collection;
        }, {});

    it("should render non-deleted fields sorts - read API", () => {
        const model = models.find(model => model.modelId === "product") as CmsModel;

        const result = renderSortEnum({
            model,
            fields: model.fields,
            fieldTypePlugins,
            sorterPlugins: [sortPlugin]
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
                "revisionFirstPublishedOn_ASC",
                "revisionFirstPublishedOn_DESC",
                "revisionLastPublishedOn_ASC",
                "revisionLastPublishedOn_DESC",
                "title_ASC",
                "title_DESC",
                "price_ASC",
                "price_DESC",
                "inStock_ASC",
                "inStock_DESC",
                "itemsInStock_ASC",
                "itemsInStock_DESC",
                "availableOn_ASC",
                "availableOn_DESC",
                "color_ASC",
                "color_DESC",
                "availableSizes_ASC",
                "availableSizes_DESC",
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
            fieldTypePlugins,
            sorterPlugins: [sortPlugin]
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
                "revisionFirstPublishedOn_ASC",
                "revisionFirstPublishedOn_DESC",
                "revisionLastPublishedOn_ASC",
                "revisionLastPublishedOn_DESC",
                "title_ASC",
                "title_DESC",
                "price_ASC",
                "price_DESC",
                "inStock_ASC",
                "inStock_DESC",
                "itemsInStock_ASC",
                "itemsInStock_DESC",
                "availableOn_ASC",
                "availableOn_DESC",
                "color_ASC",
                "color_DESC",
                "availableSizes_ASC",
                "availableSizes_DESC",
                "testSorter_ASC",
                "testSorter_DESC"
            ].join("\n")
        );
    });
});

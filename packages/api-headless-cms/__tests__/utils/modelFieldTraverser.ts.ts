import { useHandler } from "~tests/testHelpers/useHandler";
import models, { createModelPlugins } from "~tests/contentAPI/mocks/contentModels";
import { ModelFieldTraverser } from "~/utils";
import { CmsContext } from "~/types";
import { pageModel } from "~tests/contentAPI/mocks/pageWithDynamicZonesModel";
import { CmsModelToAstConverter } from "~/utils/contentModelAst";
import { CmsModelInput, createCmsModelPlugin } from "~/plugins";

describe("model field traverser", () => {
    const { handler } = useHandler({
        plugins: [
            ...createModelPlugins(models.map(model => model.modelId)),
            createCmsModelPlugin(pageModel as unknown as CmsModelInput)
        ]
    });

    let context: CmsContext;
    let converter: CmsModelToAstConverter;

    beforeEach(async () => {
        context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root"
            }
        });
        converter = context.cms.getModelToAstConverter();
    });

    it("should properly traverse through model fields - product", async () => {
        const model = await context.cms.getModel("product");
        const ast = converter.toAst(model);
        const traverser = new ModelFieldTraverser();

        const result: string[] = [];

        traverser.traverse(ast, ({ field, path }) => {
            const ref = field.settings?.models
                ? `#R#${field.settings.models
                      .map(m => m.modelId)
                      .sort()
                      .join(",")}`
                : "";
            result.push(
                `${field.type}@${path.join(".")}#${field.multipleValues ? "m" : "s"}${ref}`
            );
        });

        expect(result).toEqual([
            "text@title#s",
            "ref@category#s#R#category",
            "number@price#s",
            "boolean@inStock#s",
            "number@itemsInStock#s",
            "datetime@availableOn#s",
            "text@color#s",
            "text@availableSizes#m",
            "file@image#s",
            "rich-text@richText#s",
            "object@variant#s",
            "text@variant.name#s",
            "number@variant.price#s",
            "file@variant.images#m",
            "ref@variant.category#s#R#category",
            "object@variant.options#m",
            "text@variant.options.name#s",
            "number@variant.options.price#s",
            "file@variant.options.image#s",
            "ref@variant.options.category#s#R#category",
            "ref@variant.options.categories#m#R#category",
            "long-text@variant.options.longText#m",
            "object@fieldsObject#s",
            "text@fieldsObject.text#s"
        ]);
    });

    it("should properly traverse through model fields - page builder", async () => {
        const model = await context.cms.getModel(pageModel.modelId);
        const ast = converter.toAst(model);
        const traverser = new ModelFieldTraverser();

        const result: string[] = [];

        traverser.traverse(ast, ({ field, path }) => {
            const ref = field.settings?.models
                ? `#R#${field.settings.models
                      .map(m => m.modelId)
                      .sort()
                      .join(",")}`
                : "";
            result.push(
                `${field.type}@${path.join(".")}#${field.multipleValues ? "m" : "s"}${ref}`
            );
        });

        expect(result.sort()).toEqual([
            "dynamicZone@content#m",
            "dynamicZone@content.content#m",
            "dynamicZone@content.content#m",
            "dynamicZone@content.content#m",
            "dynamicZone@content.content#m",
            "dynamicZone@content.content.dynamicZone#s",
            "dynamicZone@content.content.dynamicZone.dynamicZone#s",
            "dynamicZone@content.content.emptyDynamicZone#s",
            "dynamicZone@ghostObject.emptyDynamicZone#s",
            "dynamicZone@header#s",
            "dynamicZone@header.header#s",
            "dynamicZone@header.header#s",
            "dynamicZone@objective#s",
            "dynamicZone@objective.objective#s",
            "dynamicZone@reference#s",
            "dynamicZone@reference.reference#s",
            "dynamicZone@references1#s",
            "dynamicZone@references1.references1#s",
            "dynamicZone@references2#m",
            "dynamicZone@references2.references2#m",
            "file@header.header.image#s",
            "long-text@content.content.text#s",
            "object@content.content.nestedObject#s",
            "object@content.content.nestedObject.objectNestedObject#m",
            "object@ghostObject#s",
            "object@objective.objective.nestedObject#s",
            "object@objective.objective.nestedObject.objectNestedObject#m",
            "ref@content.content.author#s#R#author",
            "ref@content.content.authors#m#R#author",
            "ref@content.content.dynamicZone.dynamicZone.authors#m#R#author",
            "ref@reference.reference.author#s#R#author",
            "ref@references1.references1.authors#m#R#author",
            "ref@references2.references2.author#s#R#author",
            "rich-text@objective.objective.nestedObject.objectBody#s",
            "text@content.content.nestedObject.objectNestedObject.nestedObjectNestedTitle#s",
            "text@content.content.nestedObject.objectTitle#s",
            "text@content.content.title#s",
            "text@header.header.title#s",
            "text@header.header.title#s",
            "text@objective.objective.nestedObject.objectNestedObject.nestedObjectNestedTitle#s",
            "text@objective.objective.nestedObject.objectTitle#s"
        ]);
    });
});

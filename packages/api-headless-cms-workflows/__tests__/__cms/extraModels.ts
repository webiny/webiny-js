import { createModelPlugin } from "@webiny/api-headless-cms";
import { model } from "./models.js";

type TestModel = typeof model;

/** A copy of the "author" model under another id and name. Pure. */
const createVariant = (modelId: string, name: string, pluralApiName: string): TestModel => {
    return { ...model, modelId, name, singularApiName: name.replace(/ /g, ""), pluralApiName };
};

/** `CmsModelInput` rejects `isPrivate` next to API names, so the flag is asserted onto the shape. */
const makePrivate = (input: TestModel): TestModel => {
    return { ...input, isPrivate: true } as TestModel;
};

const makeUnpublishable = (input: TestModel): TestModel => {
    return { ...input, tags: ["$publishing:false"] } as TestModel;
};

const makeSingleton = (input: TestModel): TestModel => {
    return { ...input, tags: ["singleEntry"] } as TestModel;
};

/**
 * Code models next to "author" for the editor model list: "article" and "book" are bindable,
 * "termEntry" ("Glossary") is bindable and matches a search only by its model id, "secretNote" is
 * private and "siteSetting" cannot be published
 * and "homeSetting" is a singleton.
 */
export const createExtraModelPlugins = () => {
    return [
        createModelPlugin(createVariant("article", "Article", "Articles")),
        createModelPlugin(createVariant("book", "Book", "Books")),
        createModelPlugin(createVariant("termEntry", "Glossary", "Glossaries")),
        createModelPlugin(makePrivate(createVariant("secretNote", "Secret Note", "SecretNotes"))),
        createModelPlugin(
            makeUnpublishable(createVariant("siteSetting", "Site Setting", "SiteSettings"))
        ),
        createModelPlugin(
            makeSingleton(createVariant("homeSetting", "Home Setting", "HomeSettings"))
        )
    ];
};

import { CmsEntry, CmsModel } from "~/types";
import { CmsModelProxy } from "~/content/plugins/CmsModelProxy";
import { CmsCreatedBy } from "../../../app-headless-cms/src/types";

const createdBy: CmsCreatedBy = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

const createModel = (): CmsModel => {
    return {
        name: "Fruits",
        modelId: "fruits",
        fields: [
            {
                fieldId: "name@text@abcdefg",
                alias: "name",
                id: "abcdefg",
                type: "text",
                label: "Name",
                settings: {}
            },
            {
                fieldId: "color@text@gfebca",
                alias: "color",
                id: "gfebca",
                type: "text",
                label: "Color",
                settings: {}
            },
            {
                fieldId: "description@rich-text@abclkj",
                alias: "description",
                id: "abclkj",
                type: "rich-text",
                label: "Description",
                settings: {}
            }
        ],
        layout: [["abcdefg", "gfebca", "abclkj"]],
        webinyVersion: "",
        description: "Fruits description.",
        tenant: "root",
        locale: "en-US",
        group: {
            id: "farming",
            name: "Farming"
        },
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        lockedFields: [],
        createdBy: {
            ...createdBy
        },
        titleFieldId: "name@text@abcdefg"
    };
};

const createEntry = (): CmsEntry => {
    return {
        id: "1234567890#0001",
        locale: "en-US",
        tenant: "root",
        values: {
            name: "Name of the entry",
            color: "Color of the entry",
            description: "Description of the entry"
        },
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        entryId: "1234567890",
        modelId: "fruits",
        webinyVersion: "",
        createdBy: {
            ...createdBy
        },
        locked: false,
        version: 1,
        publishedOn: new Date().toISOString(),
        ownedBy: {
            ...createdBy
        },
        status: "draft"
    };
};

describe("CmsModelProxy", () => {
    it("should correctly transform aliases and field id's", () => {
        const model = createModel();

        const proxy = new CmsModelProxy({
            model
        });

        const entry = createEntry();
        const storagePathsResult = proxy.entryToStoragePaths({
            entry: {
                ...entry
            }
        });

        expect(storagePathsResult).toEqual({
            ...entry,
            values: {
                "name@text@abcdefg": expect.any(String),
                "color@text@gfebca": expect.any(String),
                "description@rich-text@abclkj": expect.any(String)
            }
        });

        const aliasPathsResult = proxy.entryFromStoragePaths({
            entry: {
                ...storagePathsResult
            }
        });
        expect(aliasPathsResult).toEqual({
            ...entry
        });
    });
});

import { CmsIdentity } from "@webiny/api-headless-cms/types";
import { ArticleCmsEntry } from "./types";
import { createValues } from "./values";

const identity: CmsIdentity = {
    id: "abdefghijklmnopqrstuvwx",
    displayName: "A Mocked User",
    type: "admin,"
};

export interface CreateCmsEntryParams {
    entryId: string;
    tenant: string;
    locale: string;
    version: number;
    published?: boolean;
}

export const createArticleEntry = (params: CreateCmsEntryParams): ArticleCmsEntry => {
    const { entryId, version, tenant, locale, published } = params;
    if (version < 1) {
        throw new Error("Version must be greater than 0.");
    }
    return {
        id: `${entryId}#${String(version).padStart(4, "0")}`,
        entryId,
        locked: true,
        status: published ? "published" : "draft",
        ownedBy: identity,
        createdBy: identity,
        modifiedBy: identity,
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        publishedOn: published ? new Date().toISOString() : undefined,
        tenant,
        locale,
        modelId: "article",
        version,
        webinyVersion: "0.0.0",
        meta: {},
        values: createValues(entryId)
    };
};

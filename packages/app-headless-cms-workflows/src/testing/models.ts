import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { CMS_MODEL_PUBLISHING_ENABLED_TAG } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const MODEL = {
    modelId: "article",
    name: "Article",
    tags: []
} as unknown as CmsModel;

export const SINGLETON_MODEL = {
    modelId: "settings",
    name: "Settings",
    tags: [CMS_MODEL_SINGLETON_TAG]
} as unknown as CmsModel;

// A singleton that opted in to publishing and revisions.
export const PUBLISHING_SINGLETON_MODEL = {
    modelId: "banner",
    name: "Banner",
    tags: [CMS_MODEL_SINGLETON_TAG, CMS_MODEL_PUBLISHING_ENABLED_TAG]
} as unknown as CmsModel;

export const NO_PUBLISHING_MODEL = {
    modelId: "snippet",
    name: "Snippet",
    tags: ["$publishing:false"]
} as unknown as CmsModel;

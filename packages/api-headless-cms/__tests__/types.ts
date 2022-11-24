import { CmsModel as BaseCmsModel } from "~/types";

export type CmsModel = Omit<
    BaseCmsModel,
    | "locale"
    | "tenant"
    | "webinyVersion"
    | "lockedFields"
    | "createdOn"
    | "createdBy"
    | "savedOn"
    | "isPrivate"
>;

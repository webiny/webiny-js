import { CmsGroup } from "~/types";
import WebinyError from "@webiny/error";
import { CmsModel } from "../types";

const createGroup = async (handler: any): Promise<CmsGroup> => {
    const [response] = await handler.createContentModelGroupMutation({
        data: {
            name: "Test Group",
            slug: "testGroup",
            description: "",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        }
    });
    const error = response.data?.createContentModelGroup?.error;
    if (error) {
        throw new WebinyError(error.message, error.code, error.data);
    }
    const group = response.data?.createContentModelGroup?.data;
    if (!group) {
        throw new WebinyError(`There is no group data!`);
    }
    return group as CmsGroup;
};

interface Params {
    createModelValues: (group: CmsGroup) => CmsModel;
    handler: any;
}
export const createModel = async (params: Params) => {
    const { createModelValues, handler } = params;

    const group = await createGroup(handler);

    const [response] = await handler.createContentModelMutation({
        data: {
            ...createModelValues(group)
        }
    });
    const error = response.data?.createContentModel?.error;
    if (error) {
        throw new WebinyError(error.message, error.code, error.data);
    }
    const model = response.data?.createContentModel?.data as CmsModel;
    if (!model) {
        throw new WebinyError(`There is no model data!`);
    }
    return {
        model,
        group
    };
};

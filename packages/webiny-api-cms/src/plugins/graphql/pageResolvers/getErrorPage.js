// @flow
import getPublishedPage from "./getPublishedPage";

export default async (root: any, args: Object, context: Object) => {
    const { CmsSettings } = context.cms.entities;
    const settings = await CmsSettings.load();
    const parent = await settings.get("data.pages.error");

    return getPublishedPage(root, { ...args, parent }, context);
};

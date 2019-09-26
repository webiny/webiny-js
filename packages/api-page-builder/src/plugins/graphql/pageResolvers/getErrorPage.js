// @flow
import getPublishedPage from "./getPublishedPage";

export default async (root: any, args: Object, context: Object) => {
    const Settings = context.getEntity("PbSettings");
    const settings = await Settings.load();
    const parent = await settings.get("data.pages.error");

    return getPublishedPage(root, { ...args, parent }, context);
};

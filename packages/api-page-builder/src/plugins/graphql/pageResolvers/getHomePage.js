// @flow
import getPublishedPage from "./getPublishedPage";
import { get } from "lodash";

export default async (root: any, args: Object, context: Object) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    const parent = get(settings, "data.pages.home");

    return getPublishedPage(root, { ...args, parent }, context);
};

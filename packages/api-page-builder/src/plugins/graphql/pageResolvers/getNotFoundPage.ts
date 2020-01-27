import getPublishedPage from "./getPublishedPage";
import { get } from "lodash";

export default async (root: any, args: {[key: string]: any}, context: {[key: string]: any}) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    const parent = get(settings, "data.pages.notFound");

    return getPublishedPage(root, { ...args, parent }, context);
};

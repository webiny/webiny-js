// @flow
import getPublishedForm from "./getPublishedForm";

export default async (root: any, args: Object, context: Object) => {
    const { FormsSettings } = context.forms.entities;
    const settings = await FormsSettings.load();
    const parent = await settings.get("data.forms.error");

    return getPublishedForm(root, { ...args, parent }, context);
};

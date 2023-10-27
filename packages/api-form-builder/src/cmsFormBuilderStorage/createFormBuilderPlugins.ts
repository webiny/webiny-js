import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { createFormDataModelDefinition } from "./models/form.model";

export const createFormBuilderPlugins = () => {
    const groupId = "contentModelGroup_fb";

    const groupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "formBuilder",
        name: "Form Builder",
        description: "Group for Form Builder models",
        icon: "",
        isPrivate: true
    });

    return {
        groupPlugin,
        formModelDefinition: createFormDataModelDefinition()
    };
};

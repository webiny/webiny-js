import { CmsGroupPlugin, createCmsGroup } from "@webiny/api-headless-cms";

export const createGroup = (): CmsGroupPlugin => {
    return createCmsGroup({
        name: "Mailer Group",
        description: "Mailer Group for CMS",
        id: "mailerGroup",
        slug: "mailerGroup",
        icon: "none",
        isPrivate: true
    });
};

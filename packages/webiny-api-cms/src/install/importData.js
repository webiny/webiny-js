// @flow
import { Group, Policy } from "webiny-api/lib/entities";
import { Category } from "webiny-api-cms";

export default async () => {
    const cmsGroup = new Group();
    cmsGroup.populate({
        name: "CMS",
        description: "Manage CMS pages, categories, redirects etc.",
        slug: "cms"
    });

    await cmsGroup.save();

    const cmsPublicPolicy = new Policy();
    cmsPublicPolicy.populate({
        name: "CmsPublicAccess",
        slug: "cms-public-access",
        description: "Allows anonymous visitors to load pages",
        permissions: {
            api: {
                loadPageRevision: {
                    id: true,
                    slug: true,
                    title: true,
                    content: true
                },
                loadPageByUrl: {
                    id: true,
                    slug: true,
                    title: true,
                    content: true
                }
            },
            entities: {
                CmsPage: {
                    other: {
                        operations: {
                            read: true
                        }
                    }
                }
            }
        }
    });

    await cmsPublicPolicy.save();

    const defaultGroup: Group = (await Group.findOne({ query: { slug: "default" } }): any);
    defaultGroup.policies = [...(await defaultGroup.policies), cmsPublicPolicy];
    await defaultGroup.save();

    const blogCategory = new Category();
    blogCategory.populate({
        title: "Blog",
        slug: "blog",
        url: "/blog/"
    });
    await blogCategory.save();
};

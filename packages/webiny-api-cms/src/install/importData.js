import { Group, User, SecuritySettings } from "webiny-api";
import { Category } from "webiny-api-cms";
import _ from "lodash";

export default async () => {
    const cmsGroup = new Group();
    cmsGroup.populate({
        name: "CMS",
        description: "Manage CMS pages, categories, redirects etc.",
        slug: "cms",
        permissions: {
            api: {
                getCmsPage: {
                    id: true,
                    slug: true,
                    title: true,
                    pinned: true,
                    status: true,
                    content: { id: true, data: true, type: true, origin: true, settings: true },
                    category: { id: true, title: true },
                    createdBy: true,
                    createdOn: true,
                    revisions: {
                        id: true,
                        name: true,
                        slug: true,
                        title: true,
                        active: true,
                        content: { id: true, data: true, type: true, origin: true, settings: true },
                        savedOn: true,
                        createdBy: true,
                        createdOn: true,
                        updatedOn: true
                    },
                    activeRevision: { id: true }
                },
                createImage: { id: true, src: true, width: true, height: true },
                updateImage: { id: true, src: true, width: true, height: true },
                deleteImage: true,
                getCmsWidget: true,
                listCmsPages: {
                    list: {
                        id: true,
                        slug: true,
                        title: true,
                        pinned: true,
                        status: true,
                        category: { id: true, slug: true, title: true },
                        createdBy: true,
                        createdOn: true,
                        revisions: {
                            id: true,
                            name: true,
                            slug: true,
                            title: true,
                            active: true,
                            content: {
                                id: true,
                                data: true,
                                type: true,
                                origin: true,
                                settings: true
                            },
                            savedOn: true,
                            createdBy: true,
                            createdOn: true,
                            updatedOn: true,
                            createdByClassId: true
                        },
                        createdByClassId: true
                    },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                createCmsPage: {
                    id: true,
                    slug: true,
                    title: true,
                    status: true,
                    content: { id: true, data: true, type: true, origin: true, settings: true },
                    activeRevision: { id: true }
                },
                updateCmsPage: {
                    id: true,
                    slug: true,
                    title: true,
                    pinned: true,
                    status: true,
                    content: { id: true, data: true, type: true, origin: true, settings: true },
                    category: { id: true, title: true },
                    createdBy: true,
                    createdOn: true,
                    revisions: {
                        id: true,
                        name: true,
                        slug: true,
                        title: true,
                        active: true,
                        content: { id: true, data: true, type: true, origin: true, settings: true },
                        savedOn: true,
                        createdBy: true,
                        createdOn: true,
                        updatedOn: true
                    }
                },
                getCmsCategory: true,
                deleteCmsCategory: true,
                getCmsRevision: {
                    id: true,
                    name: true,
                    page: { id: true },
                    slug: true,
                    title: true,
                    active: true,
                    content: { id: true, data: true, type: true, origin: true, settings: true }
                },
                listCmsWidgets: {
                    list: { id: true, title: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                listCmsRevisions: {
                    list: { id: true, slug: true, title: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                loadPageRevision: { id: true, slug: true, title: true, content: true },
                createCmsCategory: { id: true, url: true, slug: true, title: true },
                createCmsRevision: { id: true },
                listCmsCategories: {
                    list: { id: true, url: true, slug: true, title: true, createdOn: true },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                updateCmsCategory: { id: true, url: true, slug: true, title: true },
                updateCmsRevision: {
                    id: true,
                    name: true,
                    slug: true,
                    title: true,
                    active: true,
                    content: { id: true, data: true, type: true, origin: true, settings: true }
                },
                listCmsWidgetPresets: {
                    list: {
                        id: true,
                        title: true,
                        type: true,
                        data: true
                    },
                    meta: { count: true, totalCount: true, totalPages: true }
                },
                createCmsWidgetPreset: {
                    id: true,
                    title: true,
                    type: true,
                    data: true
                }
            },
            entities: {
                File: { operations: {} },
                Image: { operations: { read: true, create: true, delete: true, update: true } },
                CmsPage: { operations: { read: true, create: true, delete: true, update: true } },
                CmsWidget: { operations: { read: true, create: true, delete: true, update: true } },
                CmsWidgetPreset: {
                    operations: { read: true, create: true, delete: true, update: true }
                },
                CmsCategory: {
                    operations: { read: true, create: true, delete: true, update: true }
                },
                CmsRevision: {
                    operations: { read: true, create: true, delete: true, update: true }
                }
            }
        }
    });

    await cmsGroup.save();

    // TODO: improve this - better install mechanism needed.
    const user = await User.findOne({ query: { email: "admin@webiny.com" } });
    const groups = [...(await user.groups)];
    groups.push(cmsGroup);
    user.groups = groups;
    await user.save();

    const securitySettings = await SecuritySettings.load();
    const clonedData = _.cloneDeep(securitySettings.data);
    _.set(clonedData, "entities.CmsRevision.other.operations.read", true);
    securitySettings.data = clonedData;
    await securitySettings.save();

    const defaultGroup = await Group.findOne({ query: { slug: "default" } });
    const clonedPermissions = _.cloneDeep(defaultGroup.permissions);

    _.set(clonedPermissions, "api.loadPageRevision", {
        id: true,
        slug: true,
        title: true,
        content: true
    });

    _.set(clonedPermissions, "api.loadPageByUrl", {
        id: true,
        slug: true,
        title: true,
        content: true
    });

    defaultGroup.permissions = clonedPermissions;
    await defaultGroup.save();

    const blogCategory = new Category();
    blogCategory.populate({
        title: "Blog",
        slug: "blog",
        url: "/blog/"
    });
    await blogCategory.save();
};

import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsContentModelGroup } from "../../src/types";
import models from "./mocks/contentModels";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";
import { SecurityIdentity } from "@webiny/api-security";

const createPermissions = permission => [
    {
        name: "cms.contentModelGroup",
        rwd: "rwd"
    },
    {
        name: "cms.contentModel",
        rwd: "rwd"
    },
    {
        name: "cms.endpoint.manage"
    },
    {
        name: "content.i18n",
        locales: ["en-US"]
    },
    ...permission
];
const userA = {
    id: "user-a",
    displayName: "User A",
    type: "admin"
};
const userB = {
    id: "user-b",
    displayName: "User B",
    type: "admin"
};

describe("entry ownership", function() {
    const manageOpts = { path: "manage/en-US" };

    const {
        createContentModelMutation,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    const identity1 = new SecurityIdentity(userA);
    const identity2 = new SecurityIdentity(userB);

    const setupContentModelGroup = async (): Promise<CmsContentModelGroup> => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        if (!createCMG?.data?.createContentModelGroup?.data) {
            throw new Error("There is no data when creating new content model group.");
        }
        return createCMG.data.createContentModelGroup.data;
    };

    const setupContentModel = async (contentModelGroup: CmsContentModelGroup, name: string) => {
        const model = models.find(m => m.modelId === name);
        // Create initial record
        const [create] = await createContentModelMutation({
            data: {
                name: model.name,
                modelId: model.modelId,
                group: contentModelGroup.id
            }
        });

        if (create.errors) {
            console.error(`[beforeEach] ${create.errors[0].message}`);
            process.exit(1);
        }

        const [update] = await updateContentModelMutation({
            modelId: create.data.createContentModel.data.modelId,
            data: {
                fields: model.fields,
                layout: model.layout
            }
        });
        return update.data.updateContentModel.data;
    };

    beforeEach(async () => {
        const group = await setupContentModelGroup();
        await setupContentModel(group, "category");
    });

    it("should load revision created by other users if user has `own` permission", async () => {
        const categoryManageHandlerForUserA = useCategoryManageHandler({
            ...manageOpts,
            identity: identity1,
            permissions: createPermissions([
                {
                    name: "cms.contentEntry",
                    own: true,
                    pw: "pu"
                }
            ])
        });
        // Create one entry with "own" permission
        const [createResponse] = await categoryManageHandlerForUserA.createCategory({
            data: {
                title: "iPhone",
                slug: "/iPhone"
            }
        });
        const entry = createResponse?.data?.createCategory?.data;
        if (!entry) {
            throw new Error("Could not create category.");
        }

        expect(createResponse).toEqual({
            data: {
                createCategory: {
                    data: {
                        createdBy: userA,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: entry.entryId,
                        id: entry.id,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: entry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "draft",
                            title: "iPhone",
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Publish entry
        const [publishResponse] = await categoryManageHandlerForUserA.publishCategory({
            revision: entry.id
        });
        const publishedEntry = publishResponse?.data?.publishCategory?.data;
        if (!publishedEntry) {
            throw new Error("Could not publish category.");
        }
        // Check it's available via get
        const [getResponse] = await categoryManageHandlerForUserA.getCategory({
            revision: publishedEntry.id
        });

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: userA,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: publishedEntry.entryId,
                        id: publishedEntry.id,
                        meta: {
                            locked: true,
                            modelId: "category",
                            publishedOn: expect.stringMatching(/^20/),
                            revisions: [
                                {
                                    id: publishedEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "published",
                            title: "iPhone",
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Create a new revision by a different user
        const categoryManageHandlerForUserB = useCategoryManageHandler({
            ...manageOpts,
            identity: identity2,
            permissions: createPermissions([
                {
                    name: "cms.contentEntry",
                    rwd: "rwd",
                    pw: "pu"
                }
            ])
        });

        const [createdFromResponse] = await categoryManageHandlerForUserB.createCategoryFrom({
            revision: publishedEntry.id
        });

        const newEntry = createdFromResponse?.data?.createCategoryFrom?.data;
        if (!newEntry) {
            throw new Error("Could not create category from.");
        }

        expect(createdFromResponse).toEqual({
            data: {
                createCategoryFrom: {
                    data: {
                        createdBy: userB,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: newEntry.entryId,
                        id: newEntry.id,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: newEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                },
                                {
                                    id: entry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "draft",
                            title: "iPhone",
                            version: 2
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Publish it
        const [publishV2Response] = await categoryManageHandlerForUserB.publishCategory({
            revision: newEntry.id
        });
        const publishedNewEntry = publishV2Response?.data?.publishCategory?.data;
        if (!publishedNewEntry) {
            throw new Error("Could not publish category.");
        }

        // Revision should be visible to it's "creator"
        let [getNewCategoryResponse] = await categoryManageHandlerForUserB.getCategory({
            revision: publishedNewEntry.id
        });

        expect(getNewCategoryResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: userB,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: publishedNewEntry.entryId,
                        id: publishedNewEntry.id,
                        meta: {
                            locked: true,
                            modelId: "category",
                            publishedOn: expect.stringMatching(/^20/),
                            revisions: [
                                {
                                    id: publishedNewEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                },
                                {
                                    id: publishedEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "published",
                            title: "iPhone",
                            version: 2
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Revision should be visible to it's "owner"
        [getNewCategoryResponse] = await categoryManageHandlerForUserA.getCategory({
            revision: publishedNewEntry.id
        });

        expect(getNewCategoryResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: userB,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: publishedNewEntry.entryId,
                        id: publishedNewEntry.id,
                        meta: {
                            locked: true,
                            modelId: "category",
                            publishedOn: expect.stringMatching(/^20/),
                            revisions: [
                                {
                                    id: publishedNewEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                },
                                {
                                    id: publishedEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "published",
                            title: "iPhone",
                            version: 2
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });
    });

    it("should not load entry created by other users if user has `own` permission", async () => {
        const categoryManageHandlerForUserA = useCategoryManageHandler({
            ...manageOpts,
            identity: identity1,
            permissions: createPermissions([
                {
                    name: "cms.contentEntry",
                    own: true,
                    pw: "pu"
                }
            ])
        });
        // Create an entry
        const [createResponse] = await categoryManageHandlerForUserA.createCategory({
            data: {
                title: "iPhone",
                slug: "/iPhone"
            }
        });
        const entry = createResponse?.data?.createCategory?.data;
        if (!entry) {
            throw new Error("Could not create category.");
        }

        expect(createResponse).toEqual({
            data: {
                createCategory: {
                    data: {
                        createdBy: userA,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: entry.entryId,
                        id: entry.id,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: entry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "draft",
                            title: "iPhone",
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Publish entry
        const [publishResponse] = await categoryManageHandlerForUserA.publishCategory({
            revision: entry.id
        });
        const publishedEntry = publishResponse?.data?.publishCategory?.data;
        if (!publishedEntry) {
            throw new Error("Could not publish category.");
        }
        // Check it's available
        const [getResponse] = await categoryManageHandlerForUserA.getCategory({
            revision: publishedEntry.id
        });

        expect(getResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: userA,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: publishedEntry.entryId,
                        id: publishedEntry.id,
                        meta: {
                            locked: true,
                            modelId: "category",
                            publishedOn: expect.stringMatching(/^20/),
                            revisions: [
                                {
                                    id: publishedEntry.id,
                                    slug: "/iPhone",
                                    title: "iPhone"
                                }
                            ],
                            status: "published",
                            title: "iPhone",
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: "/iPhone",
                        title: "iPhone"
                    },
                    error: null
                }
            }
        });

        // Create a new entry by different User
        const categoryManageHandlerForUserB = useCategoryManageHandler({
            ...manageOpts,
            identity: identity2,
            permissions: createPermissions([
                {
                    name: "cms.contentEntry",
                    rwd: "rwd",
                    pw: "pu"
                }
            ])
        });
        const newTitle = "New Title";
        const newSlug = "/new-slug";
        let [response] = await categoryManageHandlerForUserB.createCategory({
            data: {
                title: newTitle,
                slug: newSlug
            }
        });

        const newEntry = response?.data?.createCategory?.data;
        if (!newEntry) {
            throw new Error("Could not create category.");
        }

        expect(response).toEqual({
            data: {
                createCategory: {
                    data: {
                        createdBy: userB,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: newEntry.entryId,
                        id: newEntry.id,
                        meta: {
                            locked: false,
                            modelId: "category",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: newEntry.id,
                                    slug: newSlug,
                                    title: newTitle
                                }
                            ],
                            status: "draft",
                            title: newTitle,
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: newSlug,
                        title: newTitle
                    },
                    error: null
                }
            }
        });

        // Publish it
        [response] = await categoryManageHandlerForUserB.publishCategory({
            revision: newEntry.id
        });
        const publishedNewEntry = response?.data?.publishCategory?.data;
        if (!publishedNewEntry) {
            throw new Error("Could not publish category.");
        }

        // Revision should be visible to it's "owner"
        let [getNewCategoryResponse] = await categoryManageHandlerForUserB.getCategory({
            revision: publishedNewEntry.id
        });

        expect(getNewCategoryResponse).toEqual({
            data: {
                getCategory: {
                    data: {
                        createdBy: userB,
                        createdOn: expect.stringMatching(/^20/),
                        entryId: publishedNewEntry.entryId,
                        id: publishedNewEntry.id,
                        meta: {
                            locked: true,
                            modelId: "category",
                            publishedOn: expect.stringMatching(/^20/),
                            revisions: [
                                {
                                    id: publishedNewEntry.id,
                                    slug: newSlug,
                                    title: newTitle
                                }
                            ],
                            status: "published",
                            title: newTitle,
                            version: 1
                        },
                        savedOn: expect.stringMatching(/^20/),
                        slug: newSlug,
                        title: newTitle
                    },
                    error: null
                }
            }
        });

        // Revision should not be visible to User A
        [getNewCategoryResponse] = await categoryManageHandlerForUserA.getCategory({
            revision: publishedNewEntry.id
        });

        expect(getNewCategoryResponse).toEqual({
            data: {
                getCategory: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Entry by ID "${publishedNewEntry.id}" not found.`
                    }
                }
            }
        });
    });
});

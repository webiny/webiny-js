import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CmsGroup, CmsGroupCreateInput, CmsModel } from "~/types";
import { CreateContentModelMutationVariables } from "~tests/testHelpers/graphql/contentModel";

const privateGroup = new CmsGroupPlugin({
    isPrivate: true,
    name: "Private Group",
    slug: "private-group",
    icon: {
        type: "emoji",
        name: "thumbs_up",
        value: "👍"
    },
    description: "Private group description",
    id: "privateGroupId123456789"
});

const privateAuthorsModel = new CmsModelPlugin({
    isPrivate: true,
    modelId: "author",
    name: "Authors",
    layout: [["title"]],
    fields: [
        {
            id: "title",
            fieldId: "title",
            type: "text",
            label: "Title"
        }
    ],
    titleFieldId: "title",
    group: {
        id: privateGroup.contentModelGroup.id,
        name: privateGroup.contentModelGroup.name
    },
    description: "Authors model with one basic field"
});

describe("Private Groups and Models", function () {
    const manageHandlerOpts = {
        path: "manage/en-US",
        plugins: [privateGroup, privateAuthorsModel]
    };

    const {
        createContentModelGroupMutation,
        listContentModelGroupsQuery,
        createContentModelMutation,
        listContentModelsQuery
    } = useGraphQLHandler(manageHandlerOpts);

    const createGroup = async (data: CmsGroupCreateInput): Promise<CmsGroup> => {
        const [createResponse] = await createContentModelGroupMutation({
            data
        });
        return createResponse.data.createContentModelGroup.data;
    };

    const createBlogGroup = () => {
        return createGroup({
            name: "Blog",
            slug: "blog",
            description: "Blog group description",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        });
    };
    const createShopGroup = () => {
        return createGroup({
            name: "Shop",
            slug: "shop",
            description: "Shop group description",
            icon: {
                type: "emoji",
                name: "thumbs_up",
                value: "👍"
            }
        });
    };

    const createModel = async (
        data: CreateContentModelMutationVariables["data"]
    ): Promise<CmsModel> => {
        const [createResponse] = await createContentModelMutation({
            data
        });
        return createResponse.data.createContentModel.data;
    };

    const createAnimalsModel = (group: CmsGroup) => {
        return createModel({
            name: "Animals",
            modelId: "animals",
            singularApiName: "Animal",
            pluralApiName: "Animals",
            group: {
                id: group.id,
                name: group.name
            },
            description: "Animals model",
            layout: [],
            fields: [],
            titleFieldId: ""
        });
    };

    it("should not have private group in the list", async () => {
        const blogGroup = await createBlogGroup();
        const shopGroup = await createShopGroup();

        const [response] = await listContentModelGroupsQuery();

        expect(response).toMatchObject({
            data: {
                listContentModelGroups: {
                    data: [
                        {
                            id: blogGroup.id
                        },
                        {
                            id: shopGroup.id
                        }
                    ],
                    error: null
                }
            }
        });
        expect(response.data.listContentModelGroups.data).toHaveLength(2);
    });

    it("should not have private model in the list", async () => {
        const blogGroup = await createBlogGroup();
        const animalsModel = await createAnimalsModel(blogGroup);

        const [response] = await listContentModelsQuery();

        expect(response).toEqual({
            data: {
                listContentModels: {
                    data: [animalsModel],
                    error: null
                }
            }
        });
    });
});

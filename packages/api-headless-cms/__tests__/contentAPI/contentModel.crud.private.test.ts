import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CmsGroup, CmsModel } from "~/types";

const privateGroup = new CmsGroupPlugin({
    isPrivate: true,
    name: "Private Group",
    slug: "private-group",
    icon: "pri/pri",
    description: "Private group description",
    id: "privateGroupId123456789"
});

const privateAuthorsModel = new CmsModelPlugin({
    isPrivate: true,
    modelId: "author",
    name: "Authors",
    layout: [],
    fields: [],
    titleFieldId: "",
    group: {
        id: privateGroup.contentModelGroup.id,
        name: privateGroup.contentModelGroup.name
    },
    description: "Authors model with no fields"
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

    const createGroup = async (data: Record<string, any>): Promise<CmsGroup> => {
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
            icon: "def/def"
        });
    };
    const createShopGroup = () => {
        return createGroup({
            name: "Shop",
            slug: "shop",
            description: "Shop group description",
            icon: "def/def"
        });
    };

    const createModel = async (data: Record<string, any>): Promise<CmsModel> => {
        const [createResponse] = await createContentModelMutation({
            data
        });
        return createResponse.data.createContentModel.data;
    };

    const createAnimalsModel = (group: CmsGroup) => {
        return createModel({
            name: "Animals",
            modelId: "animals",
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

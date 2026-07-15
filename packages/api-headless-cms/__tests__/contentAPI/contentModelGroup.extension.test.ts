import { describe, expect, test } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { ModelGroupFactory } from "~/features/contentModelGroup/shared/abstractions.js";

class MyGroupsFactoryImpl implements ModelGroupFactory.Interface {
    public async execute() {
        return [
            {
                slug: "my-group",
                name: "My Group",
                icon: {
                    type: "icon",
                    name: "icon-name"
                }
            }
        ];
    }
}

const MyGroupsFactory = ModelGroupFactory.createImplementation({
    implementation: MyGroupsFactoryImpl,
    dependencies: []
});

describe("ModelGroupFactory test", () => {
    test("should list groups registered as extensions", async () => {
        const { listContentModelGroupsQuery } = useGraphQLHandler({
            path: "manage",
            plugins: [
                container => {
                    container.register(MyGroupsFactory);
                }
            ]
        });

        const [listResponse] = await listContentModelGroupsQuery();

        expect(listResponse).toMatchObject({
            data: {
                listContentModelGroups: {
                    data: [
                        {
                            slug: "my-group",
                            name: "My Group",
                            icon: {
                                type: "icon",
                                name: "icon-name"
                            }
                        }
                    ],
                    error: null
                }
            }
        });
    });
});

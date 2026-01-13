import { describe, expect, test } from "vitest";
import { createContextPlugin } from "@webiny/api";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { ModelGroupFactory } from "~/features/contentModelGroup/shared/abstractions.js";

class MyGroupsFactoryImpl implements ModelGroupFactory.Interface {
    execute() {
        return [
            {
                slug: "my-group",
                name: "My Group",
                icon: "icon-name"
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
                createContextPlugin(context => {
                    context.container.register(MyGroupsFactory);
                })
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
                            icon: "icon-name"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});

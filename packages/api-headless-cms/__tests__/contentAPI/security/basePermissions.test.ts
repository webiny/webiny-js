import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };
const identityC: SecurityIdentity = { id: "c", type: "admin", displayName: "C" };

const gqlApiTypesPermissions = [
    { _src: "x", name: "cms.endpoint.read" },
    { _src: "x", name: "cms.endpoint.manage" },
    { _src: "x", name: "cms.endpoint.preview" }
];

describe("Content Groups / Models / Entries - Base Permissions Checks", () => {
    test("group access scope: only groups created by the user", async () => {
        const permissions = [
            ...gqlApiTypesPermissions,
            { _src: "x", name: "cms.contentModel", own: true, rwd: "rwd", pw: "" },
            { _src: "x", name: "cms.contentModelGroup", own: true, rwd: "rwd", pw: "" },
            { _src: "x", name: "cms.contentEntry", own: false, rwd: "r", pw: "" }
        ];

        // Identity A's content model group and content model.
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions
        });

        const [modelGroupA] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group A", icon: "x" }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry A",
                singularApiName: "TestEntryA",
                pluralApiName: "TestEntryAs",
                group: {
                    id: modelGroupA.data.createContentModelGroup.data.id,
                    name: modelGroupA.data.createContentModelGroup.data.name
                }
            }
        });

        // Identity A's content model group and content model.
        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions
        });

        const [modelGroupB] = await manageApiB.createContentModelGroupMutation({
            data: { name: "Group B", icon: "x" }
        });

        await manageApiB.createContentModelMutation({
            data: {
                name: "Test Entry B",
                singularApiName: "TestEntryB",
                pluralApiName: "TestEntryBs",
                group: {
                    id: modelGroupB.data.createContentModelGroup.data.id,
                    name: modelGroupB.data.createContentModelGroup.data.name
                }
            }
        });

        const [contentModelsListA] = await manageApiA.listContentModelsQuery();
        expect(contentModelsListA).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntryA" }],
                    error: null
                }
            }
        });

        const [contentModelsListB] = await manageApiB.listContentModelsQuery();
        expect(contentModelsListB).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntryB" }],
                    error: null
                }
            }
        });
    });

    test("group access scope: only specific groups", async () => {
        // Identity A's content model group and content model.
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA
        });

        const [modelGroup1] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        const [modelGroup2] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 2", icon: "x" }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry 1",
                singularApiName: "TestEntryOne",
                pluralApiName: "TestEntryOnes",
                group: {
                    id: modelGroup1.data.createContentModelGroup.data.id,
                    name: modelGroup1.data.createContentModelGroup.data.name
                }
            }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry 2",
                singularApiName: "TestEntryTwo",
                pluralApiName: "TestEntryTwos",
                group: {
                    id: modelGroup2.data.createContentModelGroup.data.id,
                    name: modelGroup2.data.createContentModelGroup.data.name
                }
            }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: [
                ...gqlApiTypesPermissions,
                { _src: "x", name: "cms.contentModel", own: false, rwd: "r", pw: "" },
                {
                    _src: "x",
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "r",
                    pw: "",
                    groups: {
                        "en-US": [modelGroup1.data.createContentModelGroup.data.id]
                    }
                },
                { _src: "x", name: "cms.contentEntry", own: false, rwd: "r", pw: "" }
            ]
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: [
                ...gqlApiTypesPermissions,
                { _src: "y", name: "cms.contentModel", own: false, rwd: "r", pw: "" },
                {
                    _src: "y",
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "r",
                    pw: "",
                    groups: {
                        "en-US": [modelGroup2.data.createContentModelGroup.data.id]
                    }
                },
                { _src: "y", name: "cms.contentEntry", own: false, rwd: "r", pw: "" }
            ]
        });

        const [contentModelsListB] = await manageApiB.listContentModelsQuery();
        expect(contentModelsListB).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntry1" }],
                    error: null
                }
            }
        });

        const [contentModelsListC] = await manageApiC.listContentModelsQuery();
        expect(contentModelsListC).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntry2" }],
                    error: null
                }
            }
        });
    });

    test("model access scope: only models created by the user", async () => {
        const permissions = [
            ...gqlApiTypesPermissions,
            { name: "cms.contentModel", own: true, rwd: "rwd", pw: "" },
            { name: "cms.contentModelGroup", own: false, rwd: "rwd", pw: "" },
            { name: "cms.contentEntry", own: false, rwd: "r", pw: "" }
        ];

        // Identity A's content model group and content model.
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA,
            permissions
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group", icon: "x" }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry A",
                singularApiName: "TestEntryA",
                pluralApiName: "TestEntryAs",
                group: {
                    id: modelGroup.data.createContentModelGroup.data.id,
                    name: modelGroup.data.createContentModelGroup.data.name
                }
            }
        });

        // Identity A's content model group and content model.
        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions
        });

        await manageApiB.createContentModelMutation({
            data: {
                name: "Test Entry B",
                singularApiName: "TestEntryB",
                pluralApiName: "TestEntryBs",
                group: {
                    id: modelGroup.data.createContentModelGroup.data.id,
                    name: modelGroup.data.createContentModelGroup.data.name
                }
            }
        });

        const [contentModelsListA] = await manageApiA.listContentModelsQuery();
        expect(contentModelsListA).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntryA" }],
                    error: null
                }
            }
        });

        const [contentModelsListB] = await manageApiB.listContentModelsQuery();
        expect(contentModelsListB).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntryB" }],
                    error: null
                }
            }
        });
    });

    test("model access scope: only specific models", async () => {
        // Identity A's content model group and content model.
        const { manage: manageApiA } = useTestModelHandler({
            identity: identityA
        });

        const [modelGroup] = await manageApiA.createContentModelGroupMutation({
            data: { name: "Group 1", icon: "x" }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry 1",
                singularApiName: "TestEntryOne",
                pluralApiName: "TestEntryOnes",
                group: {
                    id: modelGroup.data.createContentModelGroup.data.id,
                    name: modelGroup.data.createContentModelGroup.data.name
                }
            }
        });

        await manageApiA.createContentModelMutation({
            data: {
                name: "Test Entry 2",
                singularApiName: "TestEntryTwo",
                pluralApiName: "TestEntryTwos",
                group: {
                    id: modelGroup.data.createContentModelGroup.data.id,
                    name: modelGroup.data.createContentModelGroup.data.name
                }
            }
        });

        const { manage: manageApiB } = useTestModelHandler({
            identity: identityB,
            permissions: [
                ...gqlApiTypesPermissions,
                { _src: "x", name: "cms.contentModelGroup", own: false, rwd: "rwd", pw: "" },
                {
                    _src: "x",
                    name: "cms.contentModel",
                    own: false,
                    rwd: "rwd",
                    pw: "",
                    models: {
                        "en-US": ["testEntry1"]
                    }
                },
                { _src: "x", name: "cms.contentEntry", own: true, rwd: "rwd", pw: "" }
            ]
        });

        const { manage: manageApiC } = useTestModelHandler({
            identity: identityC,
            permissions: [
                ...gqlApiTypesPermissions,
                { _src: "y", name: "cms.contentModelGroup", own: false, rwd: "rwd", pw: "" },
                {
                    _src: "y",
                    name: "cms.contentModel",
                    own: false,
                    rwd: "rwd",
                    pw: "",
                    models: {
                        "en-US": ["testEntry2"]
                    }
                },
                { _src: "y", name: "cms.contentEntry", own: true, rwd: "rwd", pw: "" }
            ]
        });

        const [contentModelsListB] = await manageApiB.listContentModelsQuery();
        expect(contentModelsListB).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntry1" }],
                    error: null
                }
            }
        });

        const [contentModelsListC] = await manageApiC.listContentModelsQuery();
        expect(contentModelsListC).toMatchObject({
            data: {
                listContentModels: {
                    data: [{ modelId: "testEntry2" }],
                    error: null
                }
            }
        });
    });
});

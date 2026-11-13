import { describe, test, expect } from "vitest";
import type { Container } from "@webiny/di";
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { EntryNotFoundError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import {
    useGraphQLHandler,
    type UseGraphQLHandlerParams
} from "~tests/helpers/useGraphQLHandler.js";

class ArticleModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: "article",
                name: "Article",
                group: "mock-group",
                singularApiName: "Article",
                pluralApiName: "Articles"
            })
            .titleFieldId("title");

        model.fields(fields => ({ title: fields.text().label("Title") })).layout([["title"]]);

        return [model];
    }
}

class PrivateModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({ modelId: "privateModel", name: "Private Model" });

        model.fields(fields => ({ title: fields.text().label("Title") }));

        return [model];
    }
}

/**
 * The test license doesn't include AI entry generation, so it is switched on here.
 */
class WcpContextWithEntryGeneration {
    constructor(decoratee: WcpContext.Interface) {
        return new Proxy(decoratee, {
            get(target, prop, receiver) {
                if (prop === "canUseAiEntryGeneration") {
                    return () => true;
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }
}

const register = (container: Container) => {
    container.register(
        ModelFactory.createImplementation({ implementation: ArticleModelFactory, dependencies: [] })
    );
    container.register(
        ModelFactory.createImplementation({ implementation: PrivateModelFactory, dependencies: [] })
    );
    container.registerDecorator(
        WcpContext.createDecorator({
            decorator: WcpContextWithEntryGeneration as unknown as new (
                decoratee: WcpContext.Interface
            ) => WcpContext.Interface,
            dependencies: []
        })
    );
};

const cmsPermissions = (rwd: string): SecurityPermission[] => {
    // CMS permissions are joined by `_src`, so they must share one.
    return [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "r" },
        { _src: "role", name: "cms.contentModel", rwd: "r" },
        { _src: "role", name: "cms.contentEntry", rwd }
    ] as unknown as SecurityPermission[];
};

const useHandler = (
    permissions?: SecurityPermission[],
    params: Omit<UseGraphQLHandlerParams, "permissions" | "register"> = {}
) => {
    return useGraphQLHandler({ ...params, permissions, register });
};

/**
 * Records the revision reads and AI calls of `compareEntryRevisions`. The capability resolves to a
 * fake one, every revision read fails and the AI is never called for real.
 */
const createCompareSpies = () => {
    const spies = { revisionReads: [] as string[], aiCalls: 0 };

    class FakeResolveAiCapability implements ResolveAiCapabilityUseCase.Interface {
        async execute(capabilityId: string) {
            return Result.ok({
                capabilityId,
                model: "test/model",
                connection: { sdkName: "test", apiKey: "test" },
                roleId: null,
                fellBackToStandard: false,
                guidance: "",
                additionalInstructions: ""
            });
        }
    }

    class RecordingGetEntryById {
        async execute(_: unknown, id: string) {
            spies.revisionReads.push(id);
            return Result.fail(new EntryNotFoundError(id));
        }
    }

    class NoAi {
        constructor(decoratee: Ai.Interface) {
            return new Proxy(decoratee, {
                get(target, prop, receiver) {
                    const value = Reflect.get(target, prop, receiver);
                    if (typeof value !== "function") {
                        return value;
                    }
                    return () => {
                        spies.aiCalls++;
                        throw new Error("AI must not be called in tests.");
                    };
                }
            });
        }
    }

    const registerSpies = (container: Container) => {
        register(container);
        container.registerDecorator(
            ResolveAiCapabilityUseCase.createDecorator({
                decorator: FakeResolveAiCapability as unknown as new (
                    decoratee: ResolveAiCapabilityUseCase.Interface
                ) => ResolveAiCapabilityUseCase.Interface,
                dependencies: []
            })
        );
        container.registerDecorator(
            GetEntryByIdUseCase.createDecorator({
                decorator: RecordingGetEntryById as unknown as new (
                    decoratee: GetEntryByIdUseCase.Interface
                ) => GetEntryByIdUseCase.Interface,
                dependencies: []
            })
        );
        container.registerDecorator(
            Ai.createDecorator({
                decorator: NoAi as unknown as new (decoratee: Ai.Interface) => Ai.Interface,
                dependencies: []
            })
        );
    };

    return { spies, registerSpies };
};

const API_KEY_IDENTITY: IdentityData = {
    id: "api-key-1",
    type: "api-key",
    displayName: "Website key"
};

describe("AI entry generation security", () => {
    test("queues a task for a model the caller can write to", async () => {
        const { generateEntryContent, taskService } = useHandler();
        const response = await generateEntryContent("article");

        expect(response.errors).toBeUndefined();
        expect(response.data.aiPowerUps.generateEntryContent).toEqual({ id: "task-1" });
        expect(taskService.triggered).toHaveLength(1);
    });

    test("is refused for a model the caller can only read", async () => {
        const { generateEntryContent, taskService } = useHandler(cmsPermissions("r"));
        const response = await generateEntryContent("article");

        expect(response.data.aiPowerUps).toBeNull();
        expect(response.errors[0].message).toMatch(/Not allowed to access "article" entries/);
        expect(taskService.triggered).toHaveLength(0);
    });

    test("queues a task with write access to the model", async () => {
        const { generateEntryContent, taskService } = useHandler(cmsPermissions("rw"));
        const response = await generateEntryContent("article");

        expect(response.errors).toBeUndefined();
        expect(taskService.triggered).toHaveLength(1);
    });

    test("treats a private model as unknown", async () => {
        const { generateEntryContent, taskService } = useHandler();
        const response = await generateEntryContent("privateModel");

        expect(response.data.aiPowerUps).toBeNull();
        expect(response.errors[0].message).toBe(`Model "privateModel" was not found!`);
        expect(taskService.triggered).toHaveLength(0);
    });

    test("treats an unknown model as unknown", async () => {
        const { generateEntryContent, taskService } = useHandler();
        const response = await generateEntryContent("doesNotExist");

        expect(response.data.aiPowerUps).toBeNull();
        expect(response.errors[0].message).toBe(`Model "doesNotExist" was not found!`);
        expect(taskService.triggered).toHaveLength(0);
    });
});

describe("AI entry generation additional files", () => {
    test("queues a task when the caller can read every additional file", async () => {
        const { generateEntryContent, taskService, getFile } = useHandler(undefined, {
            accessibleFileIds: ["file-1", "file-2"]
        });
        const response = await generateEntryContent("article", ["file-1", "file-2"]);

        expect(response.errors).toBeUndefined();
        expect(taskService.triggered).toHaveLength(1);
        expect(getFile.requested).toEqual(["file-1", "file-2"]);
    });

    test("is refused when any additional file can't be read", async () => {
        const { generateEntryContent, taskService } = useHandler(undefined, {
            accessibleFileIds: ["file-1"]
        });
        const response = await generateEntryContent("article", ["file-1", "other-tenant-file"]);

        expect(response.data.aiPowerUps).toBeNull();
        expect(response.errors[0].message).toBe("Not authorized.");
        expect(taskService.triggered).toHaveLength(0);
    });
});

describe("AI revision comparison security", () => {
    const compare = async (
        permissions: SecurityPermission[] | undefined,
        identity?: IdentityData
    ) => {
        const { spies, registerSpies } = createCompareSpies();
        const { compareEntryRevisions } = useGraphQLHandler({
            permissions,
            identity,
            register: registerSpies
        });
        const response = await compareEntryRevisions("article");
        return { response, spies };
    };

    test("is refused for API keys", async () => {
        const { response, spies } = await compare(undefined, API_KEY_IDENTITY);

        expect(response.data.cms.compareEntryRevisions).toMatchObject({
            data: null,
            error: { message: "Not authorized!" }
        });
        expect(spies.revisionReads).toHaveLength(0);
        expect(spies.aiCalls).toBe(0);
    });

    test("is refused for a model the caller can only read", async () => {
        const { response, spies } = await compare(cmsPermissions("r"));

        expect(response.data.cms.compareEntryRevisions).toMatchObject({
            data: null,
            error: { message: `Not allowed to access "article" entries.` }
        });
        expect(spies.revisionReads).toHaveLength(0);
        expect(spies.aiCalls).toBe(0);
    });

    test("reads the revisions through GetEntryByIdUseCase with write access", async () => {
        const { response, spies } = await compare(cmsPermissions("rw"));

        expect(response.data.cms.compareEntryRevisions).toMatchObject({
            data: null,
            error: { message: `Revision "a#0001" not found.` }
        });
        expect(spies.revisionReads.sort()).toEqual(["a#0001", "a#0002"]);
        expect(spies.aiCalls).toBe(0);
    });

    test("treats a private model as unknown", async () => {
        const { compareEntryRevisions } = useHandler();
        const response = await compareEntryRevisions("privateModel");

        expect(response.data.cms.compareEntryRevisions).toMatchObject({
            data: null,
            error: { message: `Content model "privateModel" not found.` }
        });
    });
});

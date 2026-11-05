import { describe, test, expect } from "vitest";
import type { Container } from "@webiny/di";
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";

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

const useHandler = (permissions?: SecurityPermission[]) => {
    return useGraphQLHandler({ permissions, register });
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

describe("AI revision comparison security", () => {
    test("treats a private model as unknown", async () => {
        const { compareEntryRevisions } = useHandler();
        const response = await compareEntryRevisions("privateModel");

        expect(response.data.cms.compareEntryRevisions).toMatchObject({
            data: null,
            error: { message: `Content model "privateModel" not found.` }
        });
    });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ModelToAstConverter } from "@webiny/api-headless-cms/features/contentModel/ModelToAstConverter/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ModelNotFoundError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { BaseGraphQLSchema } from "~/api/graphql/BaseGraphQLSchema.js";
import { CmsCompareEntryRevisionsSchema } from "~/api/graphql/CmsCompareEntryRevisionsSchema.js";
import { CmsCompareEntryRevisionsUseCaseImplementation } from "~/api/features/CmsCompareEntryRevisions/CmsCompareEntryRevisionsUseCase.js";
import { QueueCmsGenerateEntryContentFeature } from "~/api/features/QueueCmsGenerateEntryContent/feature.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import { composeSchema } from "~tests/__helpers/composeSchema.js";
import {
    FakeTaskService,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { registerFakeSecurity } from "~tests/__helpers/FakeSecurity.js";
import { registerFakeListFiles } from "~tests/__helpers/FakeListFiles.js";

interface SetupOptions {
    anonymous?: boolean;
    /** `aiPowerups.cms.entryGeneration`; on unless told otherwise. */
    entryGeneration?: boolean;
    /** The model `GetModelUseCase` answers; `null` makes it fail. */
    isPrivate?: boolean | null;
    canWrite?: boolean;
}

interface CanAccessEntryModel {
    modelId: string;
}

interface CanAccessEntryParams {
    model: CanAccessEntryModel;
    rwd?: string;
}

interface AccessCheck {
    modelId: string;
    rwd: string | undefined;
}

const createModel = (modelId: string, isPrivate: boolean) => {
    return {
        modelId,
        name: modelId,
        description: "",
        isPrivate,
        titleFieldId: "title",
        fields: []
    };
};

const setup = (options: SetupOptions = {}) => {
    const container = new Container();
    const accessChecks: AccessCheck[] = [];
    registerFakeSecurity(container, { anonymous: options.anonymous });
    registerFakeListFiles(container);

    container.registerInstance(FeatureFlags, {
        get: () => ({
            isEnabled: (flag: string) =>
                flag === "aiPowerups.cms.entryGeneration" && (options.entryGeneration ?? true)
        })
    } as unknown as FeatureFlags.Interface);

    const isPrivate = options.isPrivate === undefined ? false : options.isPrivate;
    container.registerInstance(GetModelUseCase, {
        execute: async (modelId: string) => {
            if (isPrivate === null) {
                return Result.fail(new ModelNotFoundError(modelId));
            }
            return Result.ok(createModel(modelId, isPrivate));
        }
    } as unknown as GetModelUseCase.Interface);

    container.registerInstance(AccessControl, {
        canAccessEntry: async (params: CanAccessEntryParams) => {
            accessChecks.push({ modelId: params.model.modelId, rwd: params.rwd });
            return options.canWrite ?? true;
        }
    } as unknown as AccessControl.Interface);

    const resolveCapability = {
        execute: vi.fn(async () => Result.fail(new Error("No model is configured.")))
    };
    container.registerInstance(
        ResolveAiCapabilityUseCase,
        resolveCapability as unknown as ResolveAiCapabilityUseCase.Interface
    );
    const getRevisionById = {
        execute: vi.fn(async () => Result.fail(new Error("Not found.")))
    };
    container.registerInstance(
        GetRevisionByIdUseCase,
        getRevisionById as unknown as GetRevisionByIdUseCase.Interface
    );
    container.registerInstance(Ai, {} as unknown as Ai.Interface);
    container.registerInstance(ModelToAstConverter, {} as unknown as ModelToAstConverter.Interface);

    container.register(FakeTaskService);
    QueueCmsGenerateEntryContentFeature.register(container);
    container.register(CmsCompareEntryRevisionsUseCaseImplementation);
    container.register(BaseGraphQLSchema);
    container.register(CmsCompareEntryRevisionsSchema);

    return { container, accessChecks, resolveCapability, getRevisionById };
};

const generateEntryContent = async (container: Container): Promise<unknown> => {
    const { resolvers } = await composeSchema(container);
    return resolvers.AiPowerUpsMutation.generateEntryContent(
        {},
        { prompt: "An article about cats", modelId: "article" },
        { container },
        {}
    );
};

const compareEntryRevisions = async (container: Container): Promise<any> => {
    const { resolvers } = await composeSchema(container);
    return resolvers.CmsQuery.compareEntryRevisions(
        {},
        { modelId: "article", revisionId1: "entry-1#0001", revisionId2: "entry-1#0002" },
        { container },
        {}
    );
};

beforeEach(() => {
    resetFakeTasks();
});

describe("AI Power-Ups CMS security", () => {
    describe("generateEntryContent", () => {
        it("is refused for anonymous callers", async () => {
            const { container } = setup({ anonymous: true });

            await expect(generateEntryContent(container)).rejects.toBeInstanceOf(
                NotAuthorizedError
            );
            expect(triggeredTasks).toHaveLength(0);
        });

        it("is refused when the feature flag is off", async () => {
            const { container } = setup({ entryGeneration: false });

            await expect(generateEntryContent(container)).rejects.toThrow("license");
            expect(triggeredTasks).toHaveLength(0);
        });

        it("treats a private model as unknown", async () => {
            const { container, accessChecks } = setup({ isPrivate: true });

            await expect(generateEntryContent(container)).rejects.toBeInstanceOf(
                ModelNotFoundError
            );
            expect(accessChecks).toHaveLength(0);
            expect(triggeredTasks).toHaveLength(0);
        });

        it("refuses a model the caller can't read", async () => {
            const { container } = setup({ isPrivate: null });

            await expect(generateEntryContent(container)).rejects.toBeInstanceOf(
                ModelNotFoundError
            );
            expect(triggeredTasks).toHaveLength(0);
        });

        it("requires write access to the model's entries", async () => {
            const { container, accessChecks } = setup({ canWrite: false });

            await expect(generateEntryContent(container)).rejects.toBeInstanceOf(
                EntryNotAuthorizedError
            );
            expect(accessChecks).toEqual([{ modelId: "article", rwd: "w" }]);
            expect(triggeredTasks).toHaveLength(0);
        });

        it("queues the task with write access", async () => {
            const { container } = setup();

            const result = await generateEntryContent(container);

            expect(result).toEqual({ id: "task-1" });
            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0].input).toMatchObject({ modelId: "article" });
        });
    });

    describe("compareEntryRevisions", () => {
        it("is refused for anonymous callers before anything is read", async () => {
            const { container, resolveCapability, getRevisionById } = setup({ anonymous: true });

            const response = await compareEntryRevisions(container);

            expect(response.data).toBeNull();
            expect(response.error.message).toBe("Not authorized!");
            expect(resolveCapability.execute).not.toHaveBeenCalled();
            expect(getRevisionById.execute).not.toHaveBeenCalled();
        });

        it("treats a private model as unknown and never resolves the capability", async () => {
            const { container, resolveCapability, getRevisionById } = setup({ isPrivate: true });

            const response = await compareEntryRevisions(container);

            expect(response.data).toBeNull();
            expect(response.error.message).toBe('Content model "article" not found.');
            expect(resolveCapability.execute).not.toHaveBeenCalled();
            expect(getRevisionById.execute).not.toHaveBeenCalled();
        });

        it("checks the model before the capability", async () => {
            const { container, resolveCapability } = setup();

            const response = await compareEntryRevisions(container);

            expect(resolveCapability.execute).toHaveBeenCalledTimes(1);
            expect(response.error.message).toBe("No model is configured.");
        });
    });
});

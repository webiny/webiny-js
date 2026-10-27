import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import { WorkflowsSchemaFactory } from "@webiny/api-workflows/graphql/WorkflowsSchemaFactory.js";
import { Extension } from "~/api/Extension.js";
import { AiCapability } from "~/api/features/Capabilities/index.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { ListWorkflowAiModelsUseCase } from "~/api/features/WorkflowReview/ListWorkflowAiModels/index.js";
import { registerFakeAi } from "~tests/__helpers/FakeAi.js";
import { registerRecordingLogger } from "~tests/__helpers/RecordingLogger.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";
import { registerFakeWorkflowsAccess } from "~tests/__helpers/FakeWorkflowsAccess.js";
import { composeSchema } from "~tests/__helpers/composeSchema.js";

/**
 * A bare container with the flags given. `WorkflowsFeature` registers `WorkflowsSchemaFactory` only
 * with `advancedPublishingWorkflow` on, so this does the same: the type document then contains the
 * real `WorkflowsQuery` and `WorkflowsError` the extension depends on.
 */
const createContainer = (enabledFlags: string[]): Container => {
    const container = new Container();
    container.registerInstance(FeatureFlags, {
        get: () => ({ isEnabled: (name: string) => enabledFlags.includes(name) })
    } as unknown as FeatureFlags.Interface);
    Extension.register(container);
    if (enabledFlags.includes("advancedPublishingWorkflow")) {
        container.register(WorkflowsSchemaFactory);
    }
    // `Extension.register` needs only `FeatureFlags`; what resolves lazily needs these.
    container.registerInstance(Encryption, {
        encrypt: async (plain: string) => plain,
        decrypt: async (encrypted: string) => encrypted
    } as unknown as Encryption.Interface);
    registerRecordingLogger(container);
    registerFakeAi(container, []);
    registerFakeAiPowerUpsSettings(
        container,
        createAiPowerUpsSettings({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })]
        })
    );
    registerFakeWorkflowsAccess(container);
    // The workflows services the ai step type and runner inject. Never called here.
    container.registerInstance(StepRunReachService, {} as unknown as StepRunReachService.Interface);
    container.registerInstance(
        StepRunStaleCheckService,
        {} as unknown as StepRunStaleCheckService.Interface
    );
    container.registerInstance(
        WorkflowAiToolRegistryService,
        {} as unknown as WorkflowAiToolRegistryService.Interface
    );
    container.registerInstance(
        ReviewTargetEditorService,
        {} as unknown as ReviewTargetEditorService.Interface
    );
    return container;
};

const capabilityIds = (container: Container): string[] => {
    return container.resolveAll(AiCapability).map(capability => capability.id);
};

describe("workflow review registration: the combined gate (R177, D56, Review Focus 6)", () => {
    it("registers the capability, the model list and the schema with aiPowerups and advancedPublishingWorkflow on", async () => {
        const container = createContainer(["aiPowerups", "advancedPublishingWorkflow"]);

        expect(capabilityIds(container)).toContain("workflows.review");
        expect(container.resolveAll(ListWorkflowAiModelsUseCase)).toHaveLength(1);
        const { typeDefs, schema } = await composeSchema(container);
        expect(typeDefs).toContain("listAiModels");
        const fields = Object.keys((schema.getType("WorkflowsQuery") as any).getFields());
        expect(fields).toContain("listAiModels");
        expect(fields).toContain("listStepTypes");
        expect(Object.keys((schema.getType("WorkflowsAiModel") as any).getFields())).toEqual([
            "id",
            "name",
            "providerId",
            "providerName"
        ]);
    });

    it("has a valid schema, no listAiModels field and nothing workflows-dependent with aiPowerups on and workflows off", async () => {
        const container = createContainer(["aiPowerups"]);

        expect(capabilityIds(container)).not.toContain("workflows.review");
        expect(container.resolveAll(ListWorkflowAiModelsUseCase)).toHaveLength(0);
        const { typeDefs, resolvers, schema } = await composeSchema(container);
        expect(typeDefs).not.toContain("listAiModels");
        expect(typeDefs).not.toContain("WorkflowsAiModel");
        expect(typeDefs).not.toContain("WorkflowsQuery");
        expect(resolvers.WorkflowsQuery).toBeUndefined();
        // The schema composed without the workflows types is still a valid document.
        expect(schema.getType("AiPowerUpsQuery")).toBeTruthy();
        expect(schema.getType("WorkflowsAiModel")).toBeUndefined();
    });

    it("keeps the model source under the plain aiPowerups gate (Task 15), also with workflows off", () => {
        const container = createContainer(["aiPowerups"]);

        expect(container.resolveAll(ConfiguredAiModelsService)).toHaveLength(1);
    });

    it("registers nothing of it with aiPowerups off, even with workflows on", async () => {
        const container = createContainer(["advancedPublishingWorkflow"]);

        expect(capabilityIds(container)).toEqual([]);
        expect(container.resolveAll(ListWorkflowAiModelsUseCase)).toHaveLength(0);
        const { typeDefs } = await composeSchema(container);
        expect(typeDefs).not.toContain("listAiModels");
    });

    it("registers the ai step type and the ai runner together with both flags on (R178)", () => {
        const container = createContainer(["aiPowerups", "advancedPublishingWorkflow"]);

        expect(container.resolveAll(StepType).map(stepType => stepType.type)).toEqual(["ai"]);
        const runners = container.resolveAll(StepRunner);
        expect(runners.map(runner => runner.type)).toEqual(["ai"]);
        expect(runners[0].singleRun).toBe(true);
    });

    it.each([
        { name: "aiPowerups on and workflows off", flags: ["aiPowerups"] },
        { name: "workflows on and aiPowerups off", flags: ["advancedPublishingWorkflow"] },
        { name: "both off", flags: [] as string[] }
    ])("registers no ai step type and no ai runner with $name", ({ flags }) => {
        const container = createContainer(flags);

        expect(container.resolveAll(StepType)).toHaveLength(0);
        expect(container.resolveAll(StepRunner)).toHaveLength(0);
    });
});

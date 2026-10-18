import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import type { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { ReviewStepNotCurrentError } from "@webiny/api-workflows/domain/review/errors.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError
} from "~/api/features/Capabilities/index.js";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { AiStepType } from "~/api/features/WorkflowReview/AiStepType/AiStepType.js";
import { aiStepConfigSchema } from "~/api/features/WorkflowReview/aiStepConfigSchema.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "~/api/features/WorkflowReview/aiFailureReasons.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings,
    type AiPowerUpsSettingsOptions
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";
import { createAiModel, registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
import { registerFakeWorkflowAiToolRegistry } from "~tests/__helpers/FakeWorkflowAiToolRegistry.js";
import {
    createResolvedCapability,
    registerFakeResolveAiCapability,
    type ResolveOutcome
} from "~tests/__helpers/FakeResolveAiCapability.js";
import { registerFakeStepRunReachService } from "~tests/__helpers/FakeStepRunReachService.js";
import {
    AI_MODEL,
    AI_STEP_ID,
    createAiReview,
    createAiStep,
    createAiStepConfig,
    NOW,
    paramsFor,
    requester
} from "~tests/__helpers/aiStepFixtures.js";

const MODELS: AiModel[] = [
    createAiModel("anthropic", "claude-a"),
    createAiModel("anthropic", "claude-b"),
    createAiModel("openai", "gpt-x"),
    createAiModel("google", "gem-1")
];

const SETTINGS: AiPowerUpsSettingsOptions = {
    connections: [
        createConnectionPreset({ id: "conn-anthropic", sdkName: "anthropic" }),
        // A connection without a stored key does not make its provider's models available.
        createConnectionPreset({ id: "conn-openai", sdkName: "openai", apiKeyEncrypted: "" })
    ]
};

/** The tools the registry knows; everything else is "not defined" or "not available". */
const KNOWN_TOOLS = ["readTarget", "updateTargetFields", "customTool"];

const REACH_ACTOR: Actor = {
    type: "user",
    id: "user-other",
    displayName: "Olga Other",
    identityType: "admin"
};

interface SetupOptions {
    models?: AiModel[] | Error;
    settings?: AiPowerUpsSettingsOptions | Error;
    tools?: string[];
    resolve?: ResolveOutcome;
    /**
     * The resolver asks the real `ConfiguredAiModelsService.findConnection` (as the real resolver
     * does) and fails with its failed Result, so the service's own log is part of the count.
     */
    resolveViaService?: boolean;
    reachResult?: Awaited<ReturnType<StepRunReachService.Interface["reach"]>>;
    /** Replaces the real `ConfiguredAiModelsService`, registered after it so it wins. */
    service?: ConfiguredAiModelsService.Interface;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();
    container.register(AiStepType);
    const { error } = registerFakeLogger(container);
    registerFakeAi(container, options.models ?? MODELS);
    const settings = options.settings ?? SETTINGS;
    registerFakeAiPowerUpsSettings(
        container,
        settings instanceof Error ? settings : createAiPowerUpsSettings(settings)
    );
    ConfiguredAiModelsFeature.register(container);
    if (options.service) {
        container.registerInstance(ConfiguredAiModelsService, options.service);
    }
    registerFakeWorkflowAiToolRegistry(container, options.tools ?? KNOWN_TOOLS);
    const resolveViaService: ResolveOutcome = async model => {
        const found = await container
            .resolve(ConfiguredAiModelsService)
            .findConnection(model ?? "");
        if (found.isFail()) {
            return Result.fail(found.error);
        }
        return Result.ok(createResolvedCapability(model ?? ""));
    };
    const { calls: resolveCalls } = registerFakeResolveAiCapability(
        container,
        options.resolveViaService ? resolveViaService : options.resolve
    );
    const { calls: reachCalls } = registerFakeStepRunReachService(container, options.reachResult);
    return {
        stepType: container.resolve(StepType),
        logged: error,
        resolveCalls,
        reachCalls
    };
};

/** A `ConfiguredAiModelsService` that counts its calls and lists `ids`. */
const createCountingService = (ids: string[] = [AI_MODEL]) => {
    const state = { listCalls: 0 };
    const service: ConfiguredAiModelsService.Interface = {
        list: async () => {
            state.listCalls += 1;
            return Result.ok(
                ids.map(id => {
                    return { id, name: id, providerId: id.split("/")[0], providerName: id };
                })
            );
        },
        findConnection: async () => Result.ok(null)
    };
    return { state, service };
};

describe("AiStepType (R164, R165, R166)", () => {
    it("describes itself and is available", async () => {
        const { stepType } = setup();

        expect(stepType.type).toBe("ai");
        expect(stepType.title).toBe("AI");
        expect(stepType.configSchema).toBe(aiStepConfigSchema);
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    describe("validate (pure, R165)", () => {
        it("stores the step as entered: instructions untouched, model trimmed, tools deduplicated in first-seen order", () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: {
                    instructions: "  Check the tone.\n\nBe kind.  ",
                    model: "  anthropic/claude-a  ",
                    tools: ["updateTargetFields", "readTarget", "updateTargetFields", "readTarget"]
                }
            });

            const result = stepType.validate(paramsFor(step));

            expect(result.isOk()).toBe(true);
            expect(result.value?.id).toBe(AI_STEP_ID);
            expect(result.value?.config).toEqual({
                instructions: "  Check the tone.\n\nBe kind.  ",
                model: "anthropic/claude-a",
                tools: ["updateTargetFields", "readTarget"]
            });
        });

        it("treats a missing or null tools list as empty", () => {
            const { stepType } = setup();

            for (const tools of [undefined, null]) {
                const step = createAiStep({
                    config: { instructions: "Check.", model: AI_MODEL, tools }
                });

                const result = stepType.validate(paramsFor(step));

                expect(result.value?.config).toEqual({
                    instructions: "Check.",
                    model: AI_MODEL,
                    tools: []
                });
            }
        });

        it("drops keys the config does not define", () => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ extra: "x" }) });

            const result = stepType.validate(paramsFor(step));

            expect(Object.keys(result.value?.config as object).sort()).toEqual([
                "instructions",
                "model",
                "tools"
            ]);
        });

        it.each([
            { name: "no config", config: undefined },
            { name: "a config that is not an object", config: "text" },
            { name: "a null config", config: null },
            { name: "no instructions", config: { model: AI_MODEL } },
            { name: "empty instructions", config: { instructions: "", model: AI_MODEL } },
            { name: "blank instructions", config: { instructions: " \n\t ", model: AI_MODEL } },
            {
                name: "instructions that are not a string",
                config: { instructions: 5, model: AI_MODEL }
            }
        ])("refuses $name with the instructions text", ({ config }) => {
            const { stepType } = setup();
            const step = { ...createAiStep({ title: "AI check" }), config };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe('Step "AI check" needs instructions.');
        });

        it.each([
            { name: "no model", config: { instructions: "Check." } },
            { name: "an empty model", config: { instructions: "Check.", model: "" } },
            { name: "a blank model", config: { instructions: "Check.", model: "   " } },
            { name: "a model that is not a string", config: { instructions: "Check.", model: 5 } }
        ])("refuses $name with the model text", ({ config }) => {
            const { stepType } = setup();
            const step = { ...createAiStep({ title: "AI check" }), config };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" needs a model.');
        });

        it("checks the instructions before the model", () => {
            const { stepType } = setup();
            const step = {
                ...createAiStep({ title: "AI check" }),
                config: { instructions: " ", model: " " }
            };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" needs instructions.');
        });

        it.each([
            { name: "a string", tools: "readTarget" },
            { name: "an object", tools: { name: "readTarget" } },
            { name: "a list with a non-string entry", tools: ["readTarget", 5] }
        ])("refuses tools that are $name", ({ tools }) => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ tools }) });

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" has an invalid AI configuration.');
        });

        it("refuses a tool the registry does not know, naming the first one in order (Review Focus 2)", () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: createAiStepConfig({ tools: ["readTarget", "ghostTool", "otherGhost"] })
            });

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe(
                'Step "AI check" uses the AI tool "ghostTool", which is not defined.'
            );
        });

        it("refuses a tool name that differs only in case, and a tool that was dropped as invalid", () => {
            const { stepType } = setup();

            for (const name of ["ReadTarget", "my-tool", ""]) {
                const step = createAiStep({ config: createAiStepConfig({ tools: [name] }) });

                const result = stepType.validate(paramsFor(step));

                expect(result.error?.message).toBe(
                    `Step "AI check" uses the AI tool "${name}", which is not defined.`
                );
            }
        });

        it("accepts every registered tool", () => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ tools: KNOWN_TOOLS }) });

            const result = stepType.validate(paramsFor(step));

            expect(result.isOk()).toBe(true);
        });

        it("does no I/O: it reads no model list and resolves no capability", () => {
            const counting = createCountingService();
            const { stepType, resolveCalls } = setup({ service: counting.service });

            stepType.validate(paramsFor(createAiStep()));
            stepType.validate(paramsFor(createAiStep({ config: {} })));

            expect(counting.state.listCalls).toBe(0);
            expect(resolveCalls).toEqual([]);
        });
    });

    describe("checkConfig (R165, R169, Review Focus 6)", () => {
        it("accepts a model that has a configured connection", async () => {
            const { stepType, logged } = setup();

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.isOk()).toBe(true);
            expect(logged).not.toHaveBeenCalled();
        });

        it("reads the one model source, once per check", async () => {
            const counting = createCountingService();
            const { stepType } = setup({ service: counting.service });

            await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(counting.state.listCalls).toBe(1);
        });

        it.each([
            { name: "a provider with no connection", model: "google/gem-1" },
            { name: "a provider whose connection has no key", model: "openai/gpt-x" },
            { name: "a model the provider does not list", model: "anthropic/claude-gone" },
            { name: "a model id with another case", model: "Anthropic/claude-a" }
        ])("refuses $name", async ({ model }) => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ model }) });

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result?.error?.message).toBe(
                `Step "AI check" uses the model "${model}", which is not available.`
            );
        });

        it("shows a fixed text for a failed settings read and logs once in total, the service's", async () => {
            const { stepType, logged } = setup({ settings: new Error("settings table is down") });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result?.error?.message).toBe(
                'Step "AI check" could not be checked: the configured AI models could not be loaded.'
            );
            expect(result?.error?.message).not.toContain("settings table is down");
            // The service logged the raw failure once; the step type must not log it again.
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("shows the same fixed text when the provider list throws, with no raw message and one log in total", async () => {
            const { stepType, logged } = setup({
                models: new Error("provider is down: key sk-123")
            });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.message).toBe(
                'Step "AI check" could not be checked: the configured AI models could not be loaded.'
            );
            expect(result?.error?.message).not.toContain("sk-123");
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("refuses a config that no longer parses without reading any model", async () => {
            const counting = createCountingService();
            const { stepType } = setup({ service: counting.service });
            const step = { ...createAiStep(), config: { instructions: "Check." } };

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.message).toBe('Step "AI check" has an invalid AI configuration.');
            expect(counting.state.listCalls).toBe(0);
        });
    });

    describe("error data (R267)", () => {
        const where = (field: string) => {
            return { stepId: AI_STEP_ID, field, workflowId: null };
        };

        it("marks missing instructions with config.instructions", () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: " ", model: AI_MODEL } };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.data).toEqual(where("config.instructions"));
        });

        it("marks a missing model with config.model", () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: "Check." } };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.data).toEqual(where("config.model"));
        });

        it("marks tools that are not a list of names, and a tool that is not defined, with config.tools", () => {
            const { stepType } = setup();
            const invalid = createAiStep({ config: createAiStepConfig({ tools: "readTarget" }) });
            const unknown = createAiStep({ config: createAiStepConfig({ tools: ["ghostTool"] }) });

            const invalidResult = stepType.validate(paramsFor(invalid));
            const unknownResult = stepType.validate(paramsFor(unknown));

            expect(invalidResult.error?.data).toEqual(where("config.tools"));
            expect(unknownResult.error?.data).toEqual(where("config.tools"));
        });

        it("marks a model that is not available with config.model", async () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: createAiStepConfig({ model: "anthropic/claude-gone" })
            });

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.data).toEqual(where("config.model"));
        });

        it("marks a model list that could not be loaded with config.model", async () => {
            const { stepType } = setup({ settings: new Error("settings table is down") });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.data).toEqual(where("config.model"));
        });

        it("marks a config that no longer parses with the zod issue path", async () => {
            const { stepType } = setup();
            const step = { ...createAiStep(), config: { instructions: 5, model: AI_MODEL } };

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.data).toEqual(where("config.instructions"));
        });
    });

    describe("reach (R170)", () => {
        const reachStep = (review: ReturnType<typeof createAiReview>) => review.toData().steps[0];

        it("hands the step to the shared reach service with no failure and the AI actor as owner", async () => {
            const { stepType, reachCalls, resolveCalls, logged } = setup();
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["readTarget"] })
            });
            const step = reachStep(review);

            const result = await stepType.reach({ review, step, actor: REACH_ACTOR, now: NOW });

            expect(result.isOk()).toBe(true);
            expect(resolveCalls).toEqual([{ capabilityId: "workflows.review", model: AI_MODEL }]);
            expect(reachCalls).toHaveLength(1);
            expect(reachCalls[0].review).toBe(review);
            expect(reachCalls[0].step).toBe(step);
            expect(reachCalls[0]).toMatchObject({
                actor: REACH_ACTOR,
                owner: { type: "ai", id: requester.id, displayName: requester.displayName },
                now: NOW,
                failure: null,
                startFailure: AI_REVIEW_NOT_STARTED_REASON
            });
            expect(logged).not.toHaveBeenCalled();
        });

        it("builds the owner from the requester, never from the actor who caused the reach", async () => {
            const { stepType, reachCalls } = setup();
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: REACH_ACTOR, now: NOW });

            expect(reachCalls[0].owner.id).toBe(requester.id);
            expect(reachCalls[0].owner.id).not.toBe(REACH_ACTOR.id);
            expect(reachCalls[0].owner).not.toHaveProperty("identityType");
        });

        it("returns the reach service's result unchanged (R159)", async () => {
            const refusal = new ReviewStepNotCurrentError({
                reviewId: "review-1",
                stepId: AI_STEP_ID,
                currentStepId: null
            });
            const { stepType } = setup({ reachResult: Result.fail(refusal) });
            const review = createAiReview();

            const result = await stepType.reach({
                review,
                step: reachStep(review),
                actor: requester,
                now: NOW
            });

            expect(result.isFail()).toBe(true);
            expect(result.error).toBe(refusal);
        });

        it("fails the step when the config no longer parses, before looking at tools or the capability", async () => {
            const { stepType, reachCalls, resolveCalls } = setup();
            const review = createAiReview({ config: { model: AI_MODEL } });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_STEP_INVALID_CONFIGURATION_REASON);
            expect(resolveCalls).toEqual([]);
        });

        it("fails the step with the first allowlisted tool that is no longer registered, before the capability", async () => {
            const { stepType, reachCalls, resolveCalls } = setup({ tools: ["readTarget"] });
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["readTarget", "removedTool", "otherGone"] })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(aiToolNotAvailableReason("removedTool"));
            expect(resolveCalls).toEqual([]);
        });

        it("fails the step with the model reason when the model has no connection any more, without logging", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async model => Result.fail(new AiModelNotAvailableError(model ?? ""))
            });
            const review = createAiReview({
                config: createAiStepConfig({ model: "anthropic/gone" })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(aiModelNotAvailableReason("anthropic/gone"));
            expect(logged).not.toHaveBeenCalled();
        });

        it("fails the step with the capability reason when the capability is switched off, without logging", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => {
                    return Result.fail(
                        new AiCapabilityDisabledError(
                            "workflows.review",
                            "Workflow review",
                            "Settings → AI Power-Ups"
                        )
                    );
                }
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(logged).not.toHaveBeenCalled();
        });

        it("fails the step with the capability reason for any other resolver failure and logs the raw error once", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => Result.fail(new Error("No model is configured for the role."))
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(reachCalls[0].failure).not.toContain("No model is configured");
            expect(logged).toHaveBeenCalledTimes(1);
            expect(logged.mock.calls[0][0]).toMatchObject({
                reviewId: "review-1",
                stepId: AI_STEP_ID
            });
        });

        it("logs twice in total when the real model service cannot read the settings: the service's own log and this step's (the accepted double log)", async () => {
            const { stepType, reachCalls, logged } = setup({
                settings: new Error("settings table is down"),
                resolveViaService: true
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(logged).toHaveBeenCalledTimes(2);
            // First the service's log with the raw settings error, then the reach's own.
            expect(logged.mock.calls[1][1]).toBe("Could not resolve the AI review capability.");
            expect(JSON.stringify(reachCalls[0].failure)).not.toContain("settings table is down");
        });

        it("fails the step with the generic reason when the resolver throws, logs once and never stores the raw message", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => {
                    throw new Error("could not decrypt key sk-secret");
                }
            });
            const review = createAiReview();

            const result = await stepType.reach({
                review,
                step: reachStep(review),
                actor: requester,
                now: NOW
            });

            expect(result.isOk()).toBe(true);
            expect(reachCalls[0].failure).toBe(AI_REVIEW_FAILED_REASON);
            expect(JSON.stringify(reachCalls[0].failure)).not.toContain("sk-secret");
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("always calls the reach service, also when it fails the step, so no task exists and the step is restartable", async () => {
            const { stepType, reachCalls } = setup({ tools: [] });
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["removedTool"] })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls).toHaveLength(1);
            expect(reachCalls[0].failure).not.toBeNull();
        });
    });
});

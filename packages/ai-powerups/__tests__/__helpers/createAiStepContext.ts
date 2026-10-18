import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { WorkflowsFeature } from "@webiny/api-workflows";
import { CmsWorkflowsFeature } from "@webiny/api-headless-cms-workflows";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { Extension } from "~/api/Extension.js";
import { AI_MODEL } from "./aiStepFixtures.js";
import { createAiModel } from "./FakeAi.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "./FakeAiPowerUpsSettings.js";
import { ScriptedAi } from "./ScriptedAi.js";
import { createModelPlugins } from "./AuthorModel.js";
import { FakeTaskService } from "./FakeTaskService.js";
import { registerFakeFolders } from "./FakeFolders.js";
import { captureLoggedErrors } from "./CapturingLogger.js";
import { ProbeUpdateEntry } from "./ProbeUpdateEntry.js";
import { HiddenAiToolRegistry } from "./HiddenAiToolRegistry.js";

/** The test license plus one AI Power-Ups capability: `canUseAiPowerups` is true, workflows too. */
const createAiTestLicense = (): DecryptedWcpProjectLicense => {
    const base = createTestWcpLicense();
    return {
        ...base,
        package: {
            ...base.package,
            features: {
                ...base.package.features,
                [PROJECT_PACKAGE_FEATURE_NAME.AI_POWERUPS]: {
                    enabled: true,
                    options: { lexicalGeneration: true }
                }
            }
        }
    };
};

/** The identity of the request and the requester of every review in the e2e (passed explicitly). */
export const REQUESTER_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

/**
 * Another identity, the ambient one of a task run: a task runner does not run as the requester,
 * the handler switches to it (R161).
 */
export const OTHER_IDENTITY: IdentityData = {
    id: "id-other-admin",
    type: "admin",
    displayName: "Olive Other"
};

/** The connection with a stored key the capability resolver and the model list read (R169). */
export const ANTHROPIC_CONNECTION = createConnectionPreset({ id: "conn-1", sdkName: "anthropic" });

/**
 * A CMS request context with the whole stack of the AI step: `WorkflowsFeature`,
 * `CmsWorkflowsFeature` and the production ai-powerups `Extension`. `ai` is the scripted model;
 * `presets` and `capabilityItems` are the live settings arrays and objects the fake settings
 * return: change them in place during a test (remove the connection, disable the capability).
 */
export const createAiStepContext = async () => {
    const ai = new ScriptedAi();
    // `AI_MODEL` is "<sdkName>/<modelId>": the model the step picks is the one the list offers.
    const [sdkName, modelId] = AI_MODEL.split("/");
    ai.models = [createAiModel(sdkName, modelId)];
    const presets = [ANTHROPIC_CONNECTION];
    const capabilityItems: Record<string, unknown> = {};
    const settings = createAiPowerUpsSettings({ connections: presets, capabilityItems });

    const handler = createCmsTestHandler({
        identity: REQUESTER_IDENTITY,
        testProjectLicense: createAiTestLicense(),
        legacyPlugins: createModelPlugins(),
        setup: container => {
            // Mirror the production stack: core workflows, the CMS integration, then the AI step.
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
            // ACO is not part of the harness: the CMS adapter reads these stand-ins. The
            // folder-level-permission stand-in is registered here, in `setup`; confirm on the first
            // run, and if the production registration wins, fall back to registering it with
            // `createRegisterExtensionPlugin` in `legacyPlugins` as api-headless-cms-workflows does.
            container.register(NoopFolderLevelPermissions);
            registerFakeFolders(container);
            // The saver and the reach call `TaskService`; there is no background-tasks feature.
            container.register(FakeTaskService);
            container.registerInstance(GetTaskUseCase, { execute: async () => null });
            // Deleting a review cleans up its step tasks (R256); there is no task store here.
            container.registerInstance(CleanupTaskSubtreeUseCase, {
                execute: async () => undefined
            });
            Extension.register(container);

            // Fakes last, so they win over the registrations above (nothing calls a model).
            container.registerInstance(Ai, ai);
            registerFakeAiPowerUpsSettings(container, settings);
            container.registerInstance(Encryption, {
                encrypt: async (plain: string) => plain,
                decrypt: async (encrypted: string) => `decrypted:${encrypted}`
            } as unknown as Encryption.Interface);
            captureLoggedErrors(container);
            container.registerDecorator(ProbeUpdateEntry);
            container.registerDecorator(HiddenAiToolRegistry);
        }
    });
    const context = await handler.getContext<CmsContext>();

    return { context, ai, presets, capabilityItems };
};

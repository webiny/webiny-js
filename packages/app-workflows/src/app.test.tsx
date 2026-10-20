import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/app";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin";
import { WorkflowsAdminApp } from "~/app.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { StepDrawerPresenter } from "~/editor/presentation/stepDrawer/abstractions.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import { WorkflowSettingsRepository } from "~/settings/repository/abstractions.js";
import { GetWorkflowSettingsUseCase } from "~/settings/useCases/getWorkflowSettings/abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";
import { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
import { ReviewActionDialogPresenter } from "~/review/presentation/actionDialog/abstractions.js";
import { ReviewerPickerPresenter } from "~/review/presentation/reviewerPicker/abstractions.js";
import { ReassignDialogPresenter } from "~/review/presentation/actionDialog/reassignAbstractions.js";
import { RequestReviewPresenter } from "~/review/presentation/requestReview/abstractions.js";
import { ReviewDetailsPresenter } from "~/review/presentation/reviewDetails/abstractions.js";
import { ReviewListPresenter } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetPresenter } from "~/review/presentation/reviewWidget/abstractions.js";
import { ActiveReviewBlockCollector } from "~/review/trash/ActiveReviewBlockCollector/abstractions.js";
import { ActiveReviewWarningPresenter } from "~/review/trash/ActiveReviewWarningPresenter/abstractions.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";

const flags = vi.hoisted(() => {
    return { isEnabled: vi.fn() };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: flags.isEnabled }) };
});

vi.mock("~/presentation/permissions/index.js", async importOriginal => {
    const actual = await importOriginal<typeof import("~/presentation/permissions/index.js")>();
    const react = await import("react");
    return {
        ...actual,
        SecurityPermissions: () => {
            return react.createElement("div", { "data-testid": "workflows-security-permissions" });
        }
    };
});

vi.mock("~/editor/WorkflowEditorConfig.js", async () => {
    const react = await import("react");
    return {
        WorkflowEditorConfig: () => {
            return react.createElement("div", { "data-testid": "workflow-editor-config" });
        }
    };
});

// The real component needs `useWorkflowsPermission` and `useRouter`; `ExclusionsSettings.test.tsx` covers it.
vi.mock("~/settings/mounting/ExclusionsSettings.js", async () => {
    const react = await import("react");
    return {
        ExclusionsSettings: () => {
            return react.createElement("div", { "data-testid": "exclusions-settings" });
        }
    };
});

const mount = (flagOn: boolean): Container => {
    flags.isEnabled.mockImplementation((name: string) => {
        return flagOn && name === "advancedPublishingWorkflow";
    });
    const container = new Container();
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    container.registerInstance(EventPublisher, { publish: vi.fn().mockResolvedValue(undefined) });
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    container.registerInstance(IdentityContext, {
        getIdentity: vi.fn(),
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
    container.registerInstance(FormModelFactory, { create: vi.fn() });
    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WorkflowsAdminApp />
            </CompositionProvider>
        </DiContainerProvider>
    );
    return container;
};

describe("WorkflowsAdminApp review services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the review services when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        expect(flags.isEnabled).toHaveBeenCalledWith("advancedPublishingWorkflow");
        expect(container.resolve(ReviewActivity)).toBeDefined();
        expect(container.resolve(ReviewToasts)).toBeDefined();
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers them as singletons", () => {
        const container = mount(true);

        expect(container.resolve(ReviewActivity)).toBe(container.resolve(ReviewActivity));
        expect(container.resolve(ReviewToasts)).toBe(container.resolve(ReviewToasts));
    });

    it("registers nothing when the flag is off (R211)", () => {
        const container = mount(false);

        expect(flags.isEnabled).toHaveBeenCalledWith("advancedPublishingWorkflow");
        expect(() => container.resolve(ReviewActivity)).toThrow();
        expect(() => container.resolve(ReviewToasts)).toThrow();
        expect(() => container.resolve(ReviewNotificationService)).toThrow();
    });
});

describe("WorkflowsAdminApp review view", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the review view presenters when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(TargetReviewPresenter)).toBeDefined();
        expect(container.resolve(ReviewActionDialogPresenter)).toBeDefined();
        expect(container.resolve(ReviewerPickerPresenter)).toBeDefined();
        expect(container.resolve(ReassignDialogPresenter)).toBeDefined();
        expect(container.resolve(RequestReviewPresenter)).toBeDefined();
        expect(container.resolve(ReviewDetailsPresenter)).toBeDefined();
        expect(container.resolve(ReviewListPresenter)).toBeDefined();
        expect(container.resolve(ReviewWidgetPresenter)).toBeDefined();
    });

    it("registers the presenters transient: every resolve is a new instance (R212)", () => {
        const container = mount(true);

        const first = container.resolve(TargetReviewPresenter);
        const second = container.resolve(TargetReviewPresenter);
        expect(first).not.toBe(second);
        const firstDialog = container.resolve(ReviewActionDialogPresenter);
        const secondDialog = container.resolve(ReviewActionDialogPresenter);
        const firstPicker = container.resolve(ReviewerPickerPresenter);
        const secondPicker = container.resolve(ReviewerPickerPresenter);
        expect(firstPicker).not.toBe(secondPicker);
        expect(firstDialog).not.toBe(secondDialog);
        const firstRequest = container.resolve(RequestReviewPresenter);
        const secondRequest = container.resolve(RequestReviewPresenter);
        expect(firstRequest).not.toBe(secondRequest);
        const firstDetails = container.resolve(ReviewDetailsPresenter);
        const secondDetails = container.resolve(ReviewDetailsPresenter);
        expect(firstDetails).not.toBe(secondDetails);
        const firstList = container.resolve(ReviewListPresenter);
        const secondList = container.resolve(ReviewListPresenter);
        expect(firstList).not.toBe(secondList);
        const firstWidget = container.resolve(ReviewWidgetPresenter);
        const secondWidget = container.resolve(ReviewWidgetPresenter);
        expect(firstWidget).not.toBe(secondWidget);
    });

    it("registers no review view presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(TargetReviewPresenter)).toThrow();
        expect(() => container.resolve(ReviewActionDialogPresenter)).toThrow();
        expect(() => container.resolve(ReviewerPickerPresenter)).toThrow();
        expect(() => container.resolve(ReassignDialogPresenter)).toThrow();
        expect(() => container.resolve(RequestReviewPresenter)).toThrow();
        expect(() => container.resolve(ReviewDetailsPresenter)).toThrow();
        expect(() => container.resolve(ReviewListPresenter)).toThrow();
        expect(() => container.resolve(ReviewWidgetPresenter)).toThrow();
    });
});

describe("WorkflowsAdminApp active review warning", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the warning presenter transient and the collector when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(ActiveReviewWarningPresenter);
        const second = container.resolve(ActiveReviewWarningPresenter);
        expect(first).not.toBe(second);
        expect(container.resolve(ActiveReviewBlockCollector)).toBeDefined();
    });

    it("registers nothing of it when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ActiveReviewWarningPresenter)).toThrow();
        expect(() => container.resolve(ActiveReviewBlockCollector)).toThrow();
    });
});

describe("WorkflowsAdminApp workflow editor services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the editor services when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
        expect(container.resolve(WorkflowEditorToasts)).toBeDefined();
    });

    it("registers them as singletons", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigUseCases)).toBe(
            container.resolve(WorkflowConfigUseCases)
        );
        expect(container.resolve(WorkflowEditorToasts)).toBe(
            container.resolve(WorkflowEditorToasts)
        );
    });

    it("registers no editor service when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowConfigUseCases)).toThrow();
        expect(() => container.resolve(WorkflowEditorToasts)).toThrow();
    });
});

describe("WorkflowsAdminApp workflow settings services", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the settings use cases as a singleton when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowSettingsUseCases);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(WorkflowSettingsUseCases));
    });

    it("registers the settings gateway and repository as singletons when the flag is on (R354)", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowSettingsGateway)).toBeDefined();
        expect(container.resolve(WorkflowSettingsGateway)).toBe(
            container.resolve(WorkflowSettingsGateway)
        );
        expect(container.resolve(WorkflowSettingsRepository)).toBeDefined();
        expect(container.resolve(WorkflowSettingsRepository)).toBe(
            container.resolve(WorkflowSettingsRepository)
        );
    });

    it("registers the two settings use cases transient when the flag is on (R344)", () => {
        const container = mount(true);

        const getSettings = container.resolve(GetWorkflowSettingsUseCase);
        const updateSettings = container.resolve(UpdateWorkflowSettingsUseCase);
        expect(getSettings).toBeDefined();
        expect(updateSettings).toBeDefined();
        expect(getSettings).not.toBe(container.resolve(GetWorkflowSettingsUseCase));
        expect(updateSettings).not.toBe(container.resolve(UpdateWorkflowSettingsUseCase));
    });

    it("registers no settings service when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowSettingsUseCases)).toThrow();
        expect(() => container.resolve(WorkflowSettingsGateway)).toThrow();
        expect(() => container.resolve(WorkflowSettingsRepository)).toThrow();
        expect(() => container.resolve(GetWorkflowSettingsUseCase)).toThrow();
        expect(() => container.resolve(UpdateWorkflowSettingsUseCase)).toThrow();
    });
});

describe("WorkflowsAdminApp workflow editor presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the editor presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowEditorPresenter);
        const second = container.resolve(WorkflowEditorPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no editor presenter when the flag is off (R211, Review Focus 10)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowEditorPresenter)).toThrow();
    });
});

describe("WorkflowsAdminApp editor config", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the editor config (field renderers) when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("workflow-editor-config")).toBeDefined();
    });

    it("mounts nothing of it when the flag is off (R211)", () => {
        mount(false);

        expect(screen.queryByTestId("workflow-editor-config")).toBeNull();
    });
});

describe("WorkflowsAdminApp step drawer", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the step drawer presenter as a singleton when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(StepDrawerPresenter);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(StepDrawerPresenter));
    });

    it("registers nothing of it when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(StepDrawerPresenter)).toThrow();
    });
});

describe("WorkflowsAdminApp exclusions page presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the exclusions page presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(ExclusionsPagePresenter);
        const second = container.resolve(ExclusionsPagePresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no exclusions page presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ExclusionsPagePresenter)).toThrow();
    });
});

describe("WorkflowsAdminApp exclusion dialog presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the exclusion dialog presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(ExclusionDialogPresenter);
        const second = container.resolve(ExclusionDialogPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no exclusion dialog presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ExclusionDialogPresenter)).toThrow();
    });
});

describe("WorkflowsAdminApp remove exclusion dialog presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the remove exclusion dialog presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(RemoveExclusionDialogPresenter);
        const second = container.resolve(RemoveExclusionDialogPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no remove exclusion dialog presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(RemoveExclusionDialogPresenter)).toThrow();
    });
});
describe("WorkflowsAdminApp exclusions settings (R330)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the exclusions route and menu when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("exclusions-settings")).toBeDefined();
    });

    it("mounts nothing of it when the flag is off (R211)", () => {
        mount(false);

        expect(screen.queryByTestId("exclusions-settings")).toBeNull();
    });
});

describe("WorkflowsAdminApp role form permissions (A109, R341)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("mounts the Workflows permission group when the flag is on", () => {
        mount(true);

        expect(screen.getByTestId("workflows-security-permissions")).toBeDefined();
    });

    it("mounts no Workflows permission group when the flag is off, so the role's workflows entries pass through untouched", () => {
        mount(false);

        expect(screen.queryByTestId("workflows-security-permissions")).toBeNull();
    });
});

describe("WorkflowsAdminApp workflow config services (R354)", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the config gateway and repository as singletons when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
        expect(container.resolve(WorkflowConfigRepository)).toBeDefined();
        expect(container.resolve(WorkflowConfigRepository)).toBe(
            container.resolve(WorkflowConfigRepository)
        );
    });

    it("registers the seven config use cases transient when the flag is on", () => {
        const container = mount(true);

        expect(container.resolve(ListStepTypesUseCase)).not.toBe(
            container.resolve(ListStepTypesUseCase)
        );
        expect(container.resolve(ListAutomationDefinitionsUseCase)).not.toBe(
            container.resolve(ListAutomationDefinitionsUseCase)
        );
        expect(container.resolve(ListNotificationTransportsUseCase)).not.toBe(
            container.resolve(ListNotificationTransportsUseCase)
        );
        expect(container.resolve(ListWorkflowTeamsUseCase)).not.toBe(
            container.resolve(ListWorkflowTeamsUseCase)
        );
        expect(container.resolve(ListWorkflowUsersUseCase)).not.toBe(
            container.resolve(ListWorkflowUsersUseCase)
        );
        expect(container.resolve(ListAiModelsUseCase)).not.toBe(
            container.resolve(ListAiModelsUseCase)
        );
        expect(container.resolve(ListAiToolsUseCase)).not.toBe(
            container.resolve(ListAiToolsUseCase)
        );
    });

    it("registers nothing of the config area when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(WorkflowConfigGateway)).toThrow();
        expect(() => container.resolve(WorkflowConfigRepository)).toThrow();
        expect(() => container.resolve(ListStepTypesUseCase)).toThrow();
        expect(() => container.resolve(ListAutomationDefinitionsUseCase)).toThrow();
        expect(() => container.resolve(ListNotificationTransportsUseCase)).toThrow();
        expect(() => container.resolve(ListWorkflowTeamsUseCase)).toThrow();
        expect(() => container.resolve(ListWorkflowUsersUseCase)).toThrow();
        expect(() => container.resolve(ListAiModelsUseCase)).toThrow();
        expect(() => container.resolve(ListAiToolsUseCase)).toThrow();
    });
});

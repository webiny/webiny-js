import React from "react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/app";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { WorkflowsAdminApp } from "~/app.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";
import { ReviewActionDialogPresenter } from "~/review/presentation/actionDialog/abstractions.js";
import { ReviewerPickerPresenter } from "~/review/presentation/reviewerPicker/abstractions.js";
import { ReassignDialogPresenter } from "~/review/presentation/actionDialog/reassignAbstractions.js";
import { RequestReviewPresenter } from "~/review/presentation/requestReview/abstractions.js";
import { ReviewDetailsPresenter } from "~/review/presentation/reviewDetails/abstractions.js";
import { ReviewListPresenter } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetPresenter } from "~/review/presentation/reviewWidget/abstractions.js";
import { ActiveReviewBlockCollector } from "~/review/trash/ActiveReviewBlockCollector.js";
import { ActiveReviewWarningPresenter } from "~/review/trash/ActiveReviewWarningPresenter.js";

const flags = vi.hoisted(() => {
    return { isEnabled: vi.fn() };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: flags.isEnabled }) };
});

vi.mock("~/presentation/permissions/index.js", async importOriginal => {
    const actual = await importOriginal<typeof import("~/presentation/permissions/index.js")>();
    return { ...actual, SecurityPermissions: () => null };
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
    container.registerInstance(IdentityContext, {
        getIdentity: vi.fn(),
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
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

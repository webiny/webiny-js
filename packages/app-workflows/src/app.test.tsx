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
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowsAdminApp } from "~/app.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";

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

vi.mock("~/presentation/ContentReviews.js", () => {
    return { ContentReviews: () => null };
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
    render(
        <DiContainerProvider container={container}>
            <WorkflowsAdminApp />
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

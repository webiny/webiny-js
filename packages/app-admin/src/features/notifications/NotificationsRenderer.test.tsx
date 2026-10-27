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
import { NotificationsRenderer } from "./NotificationsRenderer.js";
import type { INotification } from "./abstractions.js";

interface RendererMocks {
    toast: {
        showToast: ReturnType<typeof vi.fn>;
        showSuccessToast: ReturnType<typeof vi.fn>;
        showWarningToast: ReturnType<typeof vi.fn>;
    };
    presenter: {
        vm: { notifications: INotification[] };
        markShown: ReturnType<typeof vi.fn>;
    };
}

const mocks = vi.hoisted((): RendererMocks => {
    return {
        toast: {
            showToast: vi.fn(),
            showSuccessToast: vi.fn(),
            showWarningToast: vi.fn()
        },
        presenter: {
            vm: { notifications: [] },
            markShown: vi.fn()
        }
    };
});

vi.mock("@webiny/admin-ui", async () => {
    const react = await import("react");
    return {
        useToast: () => mocks.toast,
        Icon: (props: { className?: string }) => {
            return react.createElement("span", {
                "data-testid": "toast-icon",
                className: props.className
            });
        }
    };
});

vi.mock("@webiny/app", async () => {
    const react = await import("react");
    return {
        useFeature: () => ({ presenter: mocks.presenter }),
        SimpleLink: (props: { to: string; children?: React.ReactNode }) => {
            return react.createElement("a", { href: props.to }, props.children);
        }
    };
});

vi.mock("@webiny/icons/error.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("./feature.js", () => {
    return { NotificationsFeature: {} };
});

const notificationOf = (overrides: Partial<INotification>): INotification => {
    return { id: "notification-1", variant: "default", title: "Title", ...overrides };
};

const renderQueue = (notifications: INotification[]): void => {
    mocks.presenter.vm = { notifications };
    render(<NotificationsRenderer />);
};

describe("NotificationsRenderer", () => {
    beforeEach(() => {
        mocks.toast.showToast.mockReset();
        mocks.toast.showSuccessToast.mockReset();
        mocks.toast.showWarningToast.mockReset();
        mocks.presenter.markShown.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    describe("a notification without the new fields keeps today's call", () => {
        it("default calls showToast with title and description only", () => {
            renderQueue([notificationOf({ description: "Body" })]);

            expect(mocks.toast.showToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showSuccessToast).not.toHaveBeenCalled();
            expect(mocks.toast.showWarningToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
            expect(mocks.presenter.markShown).toHaveBeenCalledWith("notification-1");
        });

        it("default without a description keeps the description key undefined", () => {
            renderQueue([notificationOf({})]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined
            });
        });

        it("success calls showSuccessToast with title and description only", () => {
            renderQueue([notificationOf({ variant: "success", description: "Body" })]);

            expect(mocks.toast.showSuccessToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showSuccessToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
        });

        it("warning calls showWarningToast with title and description only", () => {
            renderQueue([notificationOf({ variant: "warning", description: "Body" })]);

            expect(mocks.toast.showWarningToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showWarningToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body"
            });
            expect(mocks.toast.showToast).not.toHaveBeenCalled();
            expect(mocks.presenter.markShown).toHaveBeenCalledTimes(1);
        });
    });

    describe("a notification with the new fields", () => {
        it("passes duration, position and dismissible through", () => {
            renderQueue([
                notificationOf({
                    variant: "success",
                    description: "Body",
                    duration: 8000,
                    position: "bottom-right",
                    dismissible: true
                })
            ]);

            expect(mocks.toast.showSuccessToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: "Body",
                duration: 8000,
                position: "bottom-right",
                dismissible: true
            });
        });

        it("forwards an explicit dismissible false and a zero duration", () => {
            renderQueue([notificationOf({ dismissible: false, duration: 0 })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined,
                duration: 0,
                dismissible: false
            });
        });

        it("passes only the fields that are set", () => {
            renderQueue([notificationOf({ position: "top-center" })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).toStrictEqual({
                title: "Title",
                description: undefined,
                position: "top-center"
            });
        });

        it("renders the link as an in-app link action", () => {
            renderQueue([
                notificationOf({
                    variant: "success",
                    link: { label: "Open Content Reviews", url: "/cms/content-reviews" }
                })
            ]);

            const params = mocks.toast.showSuccessToast.mock.calls[0][0];
            expect(React.isValidElement(params.actions)).toBe(true);

            render(<div>{params.actions}</div>);

            const link = screen.getByRole("link", { name: "Open Content Reviews" });
            expect(link.getAttribute("href")).toBe("/cms/content-reviews");
        });

        it("adds no actions without a link", () => {
            renderQueue([notificationOf({ duration: 8000 })]);

            expect(mocks.toast.showToast.mock.calls[0][0]).not.toHaveProperty("actions");
        });

        it("error calls showToast with the destructive error icon and the other fields", () => {
            renderQueue([
                notificationOf({
                    variant: "error",
                    description: "Body",
                    duration: 8000,
                    position: "bottom-right",
                    dismissible: true
                })
            ]);

            expect(mocks.toast.showToast).toHaveBeenCalledTimes(1);
            expect(mocks.toast.showSuccessToast).not.toHaveBeenCalled();
            expect(mocks.toast.showWarningToast).not.toHaveBeenCalled();

            const params = mocks.toast.showToast.mock.calls[0][0];
            expect(params.title).toBe("Title");
            expect(params.description).toBe("Body");
            expect(params.duration).toBe(8000);
            expect(params.position).toBe("bottom-right");
            expect(params.dismissible).toBe(true);
            expect(React.isValidElement(params.icon)).toBe(true);
            expect(params.icon.props.className).toBe("fill-destructive");
        });

        it("error without the new fields still shows through showToast with the icon", () => {
            renderQueue([notificationOf({ variant: "error" })]);

            const params = mocks.toast.showToast.mock.calls[0][0];
            expect(Object.keys(params).sort()).toEqual(["description", "icon", "title"]);
        });
    });

    it("shows every queued notification oldest first and marks each shown once", () => {
        renderQueue([
            notificationOf({ id: "notification-1", title: "One" }),
            notificationOf({ id: "notification-2", variant: "warning", title: "Two" }),
            notificationOf({ id: "notification-3", variant: "error", title: "Three" })
        ]);

        expect(mocks.toast.showToast.mock.calls.map(call => call[0].title)).toEqual([
            "One",
            "Three"
        ]);
        expect(mocks.toast.showWarningToast.mock.calls[0][0].title).toBe("Two");
        expect(mocks.presenter.markShown.mock.calls.map(call => call[0])).toEqual([
            "notification-1",
            "notification-2",
            "notification-3"
        ]);
    });
});

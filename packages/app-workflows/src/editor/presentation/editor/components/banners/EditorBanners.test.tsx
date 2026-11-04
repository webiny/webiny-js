import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { SaveBannerKind } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createOptionsBannerVm } from "~/editor/testing/createBannerVm.js";
import { createSaveBannerVm } from "~/editor/testing/createBannerVm.js";
import { OptionsFailureBanner } from "./OptionsFailureBanner.js";
import { SaveBanner } from "./SaveBanner.js";

const renderSaveBanner = (banner: SaveBannerVm) => {
    const onReload = vi.fn();
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    renderWithAdminUi(
        <SaveBanner banner={banner} onReload={onReload} onRetry={onRetry} onDismiss={onDismiss} />
    );
    return { onReload, onRetry, onDismiss };
};

interface KindCase {
    kind: SaveBannerKind;
    testId: string;
}

const KINDS: KindCase[] = [
    { kind: "duplicate", testId: "duplicate-banner" },
    { kind: "message", testId: "message-banner" },
    { kind: "transport", testId: "transport-banner" }
];

describe("SaveBanner", () => {
    for (const { kind, testId } of KINDS) {
        it(`renders the ${kind} banner with its message`, () => {
            const banner = createSaveBannerVm(kind);
            renderSaveBanner(banner);

            expect(screen.getByTestId(testId)).toBeTruthy();
            expect(screen.getByText(banner.message)).toBeTruthy();
        });
    }

    it("shows the transport banner's title above its message (QBZ-10)", () => {
        renderSaveBanner(createSaveBannerVm("transport"));

        expect(screen.getByText("Could not save the workflow")).toBeTruthy();
        expect(
            screen.getByText(
                "The server did not respond, so nothing was saved. Your changes are kept."
            )
        ).toBeTruthy();
    });

    it("shows no title for a banner without one", () => {
        renderSaveBanner(createSaveBannerVm("message"));

        expect(screen.queryByText("Could not save the workflow")).toBeNull();
    });

    it("runs Reload on the duplicate banner", () => {
        const { onReload, onRetry } = renderSaveBanner(createSaveBannerVm("duplicate"));

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));

        expect(onReload).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
    });

    it("runs Try again on the transport banner", () => {
        const { onRetry, onReload } = renderSaveBanner(createSaveBannerVm("transport"));

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onReload).not.toHaveBeenCalled();
    });

    it("has no Reload button when the duplicate banner cannot reload", () => {
        renderSaveBanner(createSaveBannerVm("duplicate", { canReload: false }));

        expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    });

    it("has no action button on a plain message banner", () => {
        renderSaveBanner(createSaveBannerVm("message"));

        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    });

    it("dismisses a dismissible banner", () => {
        const { onDismiss, onRetry } = renderSaveBanner(createSaveBannerVm("transport"));

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
    });

    it("has no dismiss button on a banner that cannot be dismissed", () => {
        renderSaveBanner(createSaveBannerVm("duplicate"));

        expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    });
});

describe("OptionsFailureBanner", () => {
    it("shows the message and runs Try again", () => {
        const onRetry = vi.fn();
        renderWithAdminUi(
            <OptionsFailureBanner banner={createOptionsBannerVm()} onRetry={onRetry} />
        );

        expect(screen.getByTestId("options-banner")).toBeTruthy();
        expect(screen.getByText("Could not load the step options.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("has no dismiss button", () => {
        renderWithAdminUi(
            <OptionsFailureBanner banner={createOptionsBannerVm()} onRetry={vi.fn()} />
        );

        expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    });
});

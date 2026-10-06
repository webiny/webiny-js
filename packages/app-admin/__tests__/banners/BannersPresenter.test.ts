import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Banners as BannersAbstraction } from "~/features/banners/abstractions.js";
import { Banners } from "~/features/banners/Banners.js";
import { BannersPresenter as PresenterAbstraction } from "~/presentation/banners/abstractions.js";
import { BannersPresenter } from "~/presentation/banners/BannersPresenter.js";

const setup = () => {
    const container = new Container();
    container.register(Banners).inSingletonScope();
    container.register(BannersPresenter).inSingletonScope();

    return {
        banners: container.resolve(BannersAbstraction),
        presenter: container.resolve(PresenterAbstraction)
    };
};

describe("BannersPresenter", () => {
    it("shows nothing when there are no banners", () => {
        const { presenter } = setup();

        expect(presenter.vm.banner).toBeNull();
    });

    it("shows the most severe banner", () => {
        const { banners, presenter } = setup();

        banners.show({ id: "a", variant: "warning", message: "Careful." });
        banners.show({ id: "b", variant: "info", message: "Heads up." });

        expect(presenter.vm.banner?.id).toBe("a");
    });

    it("shows the most recent of equally severe banners", () => {
        const { banners, presenter } = setup();

        banners.show({ id: "a", variant: "info", message: "First." });
        banners.show({ id: "b", variant: "info", message: "Second." });

        expect(presenter.vm.banner?.id).toBe("b");
    });

    it("updates a banner in place instead of adding a second one", () => {
        const { banners, presenter } = setup();

        banners.show({ id: "a", variant: "info", message: "First." });
        banners.show({ id: "b", variant: "info", message: "Second." });
        banners.show({ id: "a", variant: "info", message: "First, changed." });

        expect(banners.getBanners()).toHaveLength(2);
        expect(presenter.vm.banner?.id).toBe("b");
    });

    it("shows the next banner once the current one is hidden", () => {
        const { banners, presenter } = setup();

        banners.show({ id: "a", variant: "info", message: "Waiting." });
        banners.show({ id: "b", variant: "error", message: "Broken." });
        banners.hide("b");

        expect(presenter.vm.banner?.id).toBe("a");
    });

    it("runs the action of the banner on screen", () => {
        const { banners, presenter } = setup();
        const onClick = vi.fn();

        banners.show({
            id: "a",
            variant: "warning",
            message: "Careful.",
            action: { label: "Fix", onClick }
        });
        presenter.runAction();

        expect(onClick).toHaveBeenCalledOnce();
        expect(presenter.vm.banner?.actionLabel).toBe("Fix");
    });

    it("dismisses the banner on screen", () => {
        const { banners, presenter } = setup();

        banners.show({ id: "a", variant: "success", message: "Saved.", dismissible: true });
        presenter.dismiss();

        expect(presenter.vm.banner).toBeNull();
    });
});

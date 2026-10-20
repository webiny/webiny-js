import React from "react";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { act } from "@testing-library/react";
import { render } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { BannersFeature } from "~/features/banners/feature.js";
import { useBanner } from "~/presentation/banners/useBanner.js";
import { Banner } from "~/presentation/banners/components/Banner.js";

const setup = () => {
    const container = new Container();
    BannersFeature.register(container);
    const { banners } = BannersFeature.resolve(container);

    const wrapper = ({ children }: { children: React.ReactNode }) => {
        return <DiContainerProvider container={container}>{children}</DiContainerProvider>;
    };

    return { banners, wrapper };
};

describe("useBanner", () => {
    it("shows and hides a banner", () => {
        const { banners, wrapper } = setup();
        const { result } = renderHook(() => useBanner(), { wrapper });

        act(() => {
            result.current.showBanner({ id: "a", variant: "success", message: "Published." });
        });
        expect(banners.getBanners()).toHaveLength(1);

        act(() => {
            result.current.hideBanner("a");
        });
        expect(banners.getBanners()).toHaveLength(0);
    });
});

describe("Banner", () => {
    it("shows the banner while mounted and hides it on unmount", () => {
        const { banners, wrapper } = setup();
        const { unmount } = render(<Banner id={"a"} variant={"info"} message={"Heads up."} />, {
            wrapper
        });

        expect(banners.getBanners()).toHaveLength(1);

        unmount();

        expect(banners.getBanners()).toHaveLength(0);
    });
});

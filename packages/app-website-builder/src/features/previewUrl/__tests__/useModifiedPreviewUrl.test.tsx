import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app-admin";
import { PreviewUrlModifier } from "../abstractions.js";
import { useModifiedPreviewUrl } from "../useModifiedPreviewUrl.js";

const modifier = (modify: (url: URL) => Promise<void>) => {
    class Modifier implements PreviewUrlModifier.Interface {
        modify = modify;
    }

    return PreviewUrlModifier.createImplementation({
        implementation: Modifier,
        dependencies: []
    });
};

function render(container: Container, baseUrl: string | null) {
    return renderHook(({ baseUrl }) => useModifiedPreviewUrl(baseUrl), {
        initialProps: { baseUrl },
        wrapper: ({ children }) => (
            <DiContainerProvider container={container}>{children}</DiContainerProvider>
        )
    });
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useModifiedPreviewUrl", () => {
    it("is the base URL without modifiers", () => {
        const { result } = render(new Container(), "https://preview.example/page");

        expect(result.current).toBe("https://preview.example/page");
    });

    it("is the modified URL once the modifiers ran", async () => {
        const container = new Container();
        container.register(modifier(async url => url.searchParams.set("a", "1")));
        const { result } = render(container, "https://preview.example/page");

        expect(result.current).toBeNull();
        await waitFor(() => expect(result.current).toBe("https://preview.example/page?a=1"));
    });

    it("is null, not the partly modified URL, when a modifier fails", async () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const container = new Container();
        container.register(modifier(async url => url.searchParams.set("a", "1")));
        container.register(
            modifier(async () => {
                throw new Error("No token");
            })
        );
        const { result } = render(container, "https://preview.example/page");

        await waitFor(() => expect(error).toHaveBeenCalled());
        expect(result.current).toBeNull();
    });

    it("doesn't show the previous URL while the modifiers run for a new one", async () => {
        const container = new Container();
        container.register(modifier(async url => url.searchParams.set("m", "1")));
        const { result, rerender } = render(container, "https://preview.example/first");
        await waitFor(() => expect(result.current).toBe("https://preview.example/first?m=1"));

        rerender({ baseUrl: "https://preview.example/second" });

        expect(result.current).toBeNull();
        await waitFor(() => expect(result.current).toBe("https://preview.example/second?m=1"));
    });

    it("drops the result for a base URL that has since changed", async () => {
        let releaseFirst: () => void = () => undefined;
        const container = new Container();
        container.register(
            modifier(async url => {
                if (url.pathname === "/first") {
                    await new Promise<void>(resolve => (releaseFirst = resolve));
                }
                url.searchParams.set("m", "1");
            })
        );
        const { result, rerender } = render(container, "https://preview.example/first");

        rerender({ baseUrl: "https://preview.example/second" });
        expect(result.current).toBeNull();
        await waitFor(() => expect(result.current).toBe("https://preview.example/second?m=1"));

        releaseFirst();
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(result.current).toBe("https://preview.example/second?m=1");
    });
});

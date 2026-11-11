import React from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app-admin";
import { PreviewUrlModifier } from "../abstractions.js";
import { usePreviewUrlModifier } from "../usePreviewUrlModifier.js";

const setParam = (name: string, value: string) => {
    class SetParam implements PreviewUrlModifier.Interface {
        async modify(url: URL) {
            url.searchParams.set(name, value + (url.searchParams.get("order") ?? ""));
            url.searchParams.set("order", (url.searchParams.get("order") ?? "") + name);
        }
    }

    return PreviewUrlModifier.createImplementation({
        implementation: SetParam,
        dependencies: []
    });
};

function render(container: Container) {
    return renderHook(() => usePreviewUrlModifier(), {
        wrapper: ({ children }) => (
            <DiContainerProvider container={container}>{children}</DiContainerProvider>
        )
    }).result.current;
}

describe("usePreviewUrlModifier", () => {
    it("is null without modifiers", () => {
        expect(render(new Container())).toBeNull();
    });

    it("applies every registered modifier, in registration order", async () => {
        const container = new Container();
        container.register(setParam("a", "1"));
        container.register(setParam("b", "2"));
        const url = new URL("https://preview.example/page");

        await render(container)!.modify(url);

        expect(url.searchParams.get("a")).toBe("1");
        expect(url.searchParams.get("b")).toBe("2a");
        expect(url.searchParams.get("order")).toBe("ab");
    });
});

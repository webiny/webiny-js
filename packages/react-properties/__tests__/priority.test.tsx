import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import { Property, toObject, createConfigurableComponent } from "~/index";
import { getLastCall, flush } from "~tests/utils";

interface ToolbarConfig {
    actions: Array<{ name: string }>;
}

const base = createConfigurableComponent<ToolbarConfig>("TestToolbar");
const ToolbarConfig = base.Config;
const ToolbarWithConfig = base.WithConfig;

const ToolbarAction = ({ name, after }: { name: string; after?: string }) => {
    const placeAfter = after ? `action:${after}` : undefined;
    return (
        <Property id={`action:${name}`} name={"actions"} array after={placeAfter}>
            <Property id={`action:${name}:name`} name={"name"} value={name} />
        </Property>
    );
};

describe("Config Priority Ordering", () => {
    it("should place primary properties before secondary, regardless of render order", async () => {
        const onChange = vi.fn();

        // Secondary config renders BEFORE primary in the tree (simulates extensions
        // being mounted higher than built-in configs).
        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Primary actions (bold, italic) must come before secondary (emoji).
        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic", "emoji"]);
    });

    it("should preserve relative order within the same priority", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                    <ToolbarAction name={"customAction"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                    <ToolbarAction name={"underline"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // Primary first in their original order, then secondary in their original order.
        expect(data.actions.map(a => a.name)).toEqual([
            "bold",
            "italic",
            "underline",
            "emoji",
            "customAction"
        ]);
    });

    it("should support after placement within secondary priority", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} after={"italic"} />
                </ToolbarConfig>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        // emoji should be placed after italic (its `after` target).
        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic", "emoji"]);
    });

    it("should work when only primary config is provided", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"primary"}>
                    <ToolbarAction name={"bold"} />
                    <ToolbarAction name={"italic"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["bold", "italic"]);
    });

    it("should work when only secondary config is provided", async () => {
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig priority={"secondary"}>
                    <ToolbarAction name={"emoji"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["emoji"]);
    });

    it("should preserve declaration order across multiple Config calls at the same priority", async () => {
        /**
         * This test guards the children ordering inside createHOC.
         * Each <Config> composes a HOC via Compose; the outermost HOC is the last
         * one composed. Placing {newChildren} before {children} in the HOC ensures
         * the first-declared Config's properties mount first.
         *
         * If the order were accidentally swapped ({children} before {newChildren}),
         * the resulting array would be reversed: ["gamma", "beta", "alpha"].
         */
        const onChange = vi.fn();

        const view = (
            <CompositionProvider>
                <ToolbarConfig>
                    <ToolbarAction name={"alpha"} />
                </ToolbarConfig>
                <ToolbarConfig>
                    <ToolbarAction name={"beta"} />
                </ToolbarConfig>
                <ToolbarConfig>
                    <ToolbarAction name={"gamma"} />
                </ToolbarConfig>
                <ToolbarWithConfig onProperties={onChange}>
                    <div />
                </ToolbarWithConfig>
            </CompositionProvider>
        );

        render(view);
        await flush();

        const properties = getLastCall(onChange);
        const data = toObject<ToolbarConfig>(properties);

        expect(data.actions.map(a => a.name)).toEqual(["alpha", "beta", "gamma"]);
    });
});

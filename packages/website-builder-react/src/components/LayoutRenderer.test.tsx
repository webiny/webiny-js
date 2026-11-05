import React from "react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { contentSdk, createTextInput, type PublicLayout } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import type { ComponentProps } from "~/types.js";
import { LayoutRenderer } from "./LayoutRenderer.js";

const Header = createComponent(
    ({ inputs }: ComponentProps<{ title: string }>) => <header>{inputs.title}</header>,
    {
        name: "Test/Header",
        global: true,
        inputs: [createTextInput({ name: "title", defaultValue: "Welcome" })]
    }
);

const element = (id: string, name: string, parentId?: string) => ({
    type: "Webiny/Element" as const,
    id,
    component: { name },
    parent: parentId ? { id: parentId, slot: "children" } : undefined
});

const createLayout = (globals: Pick<PublicLayout, "elements" | "bindings">): PublicLayout => ({
    ...globals,
    layout: {
        id: "layout-1",
        elements: {
            root: element("root", "Webiny/Root"),
            header: element("header", "Test/Header", "root"),
            main: element("main", "Webiny/LayoutContent", "root"),
            sidebar: element("sidebar", "Webiny/NamedContent", "root"),
            promo: element("promo", "Webiny/NamedContent", "root")
        },
        bindings: {
            root: {
                inputs: {
                    children: {
                        id: "children",
                        type: "slot",
                        list: true,
                        static: ["header", "main", "sidebar", "promo"]
                    }
                }
            },
            sidebar: { inputs: { area: { id: "sidebar-area", type: "text", static: "sidebar" } } },
            promo: { inputs: { area: { id: "promo-area", type: "text", static: "promo" } } }
        }
    }
});

const render = (layout: PublicLayout, areas?: Record<string, React.ReactNode>) => {
    return renderToString(
        <LayoutRenderer layout={layout} components={[Header]} areas={areas}>
            <article>The entry</article>
        </LayoutRenderer>
    );
};

describe("LayoutRenderer", () => {
    beforeAll(() => {
        contentSdk.init({ apiKey: "key", apiHost: "https://api.test", apiTenant: "root" });
    });

    it("renders the children in Main content, inside the layout", () => {
        const html = render(createLayout({ elements: {}, bindings: {} }));

        expect(html).toContain("<article>The entry</article>");
        expect(html.indexOf("<header>")).toBeLessThan(html.indexOf("<article>"));
    });

    it("renders a global the layout places from its manifest defaults when it was never saved", () => {
        const html = render(createLayout({ elements: {}, bindings: {} }));

        expect(html).toContain("<header>Welcome</header>");
    });

    it("renders a global the layout places with its delivered values", () => {
        const html = render(
            createLayout({
                elements: {
                    "$global:Test/Header": element("$global:Test/Header", "Test/Header")
                },
                bindings: {
                    "$global:Test/Header": {
                        inputs: { title: { id: "title", type: "text", static: "ACME Inc" } }
                    }
                }
            })
        );

        expect(html).toContain("<header>ACME Inc</header>");
    });

    it("fills named content areas by name, and leaves the others empty", () => {
        const html = render(createLayout({ elements: {}, bindings: {} }), {
            sidebar: <aside>Related</aside>
        });

        expect(html).toContain("<aside>Related</aside>");
        expect(html.indexOf("<article>")).toBeLessThan(html.indexOf("<aside>"));
        expect(html).not.toContain("promo");
    });
});

"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as sdkNextjs from "./index.js";
import { sdk, type HydratedComponent } from "@webiny/sdk-frontend";
import { contentSdk, type Component, type Document } from "@webiny/website-builder-sdk";
import { ensureThemeTokenLink } from "./themeTokenLink.js";

const DocumentRenderer = dynamic(
    () => import("@webiny/website-builder-nextjs").then(m => ({ default: m.DocumentRenderer })),
    { ssr: false }
);

export interface ComponentSandboxProps {
    components?: Component[];
}

const SANDBOX_DOCUMENT: Document = {
    id: "sandbox-placeholder",
    version: 1,
    state: {},
    properties: { id: "sandbox-placeholder", path: "/sandbox/component", title: "Sandbox" },
    extensions: {},
    metadata: {},
    bindings: {},
    elements: {
        root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } }
    }
};

function getParentOrigin(): string {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get("wb.referrer") || "";
    } catch {
        return "";
    }
}

/**
 * Ensures the site's active theme token layer is present, so a previewed component's `var(--wby-*)`
 * values resolve to a real theme instead of falling back. Idempotent — a no-op when the host layout
 * already emits `tokens.css`. A specific theme chosen in the admin is layered on top of this via the
 * pushed override CSS (see below), never fetched from the iframe, which is unauthenticated and cannot
 * read the (permission-gated) per-theme preview artifact.
 */
function useActiveThemeTokens(): void {
    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }
        return ensureThemeTokenLink(document, sdk.theme.artifactUrl("css"));
    }, []);
}

interface BundlePayload {
    name: string;
    bundledJs: string;
    bundledCss: string;
}

interface CssPayload {
    css: string;
    componentName: string;
}

interface ThemeCssPayload {
    /** The rendered `--wby-*` token CSS of the theme being previewed, or "" to fall back to active. */
    css: string;
}

interface ThemeModePayload {
    /** "light" or "dark" to force that mode, or "" to follow the system default. */
    mode: string;
}

// The theme's dark values apply under this attribute on :root — see the theme-common CSS artifact.
const THEME_MODE_ATTRIBUTE = "data-wby-theme-mode";

let pendingBundle: BundlePayload | null = null;
let pendingCss: CssPayload | null = null;
let pendingThemeCss: ThemeCssPayload | null = null;
let pendingThemeMode: ThemeModePayload | null = null;
let bundleCallback: ((bundle: BundlePayload) => void) | null = null;
let cssCallback: ((payload: CssPayload) => void) | null = null;
let themeCssCallback: ((payload: ThemeCssPayload) => void) | null = null;
let themeModeCallback: ((payload: ThemeModePayload) => void) | null = null;

if (typeof window !== "undefined") {
    window.addEventListener("message", (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data.type !== "string") {
            return;
        }

        if (data.type === "wb.editor.sandbox.component.bundle") {
            if (bundleCallback) {
                bundleCallback(data.payload as BundlePayload);
            } else {
                pendingBundle = data.payload as BundlePayload;
            }
        }

        if (data.type === "wb.editor.sandbox.component.css") {
            if (cssCallback) {
                cssCallback(data.payload as CssPayload);
            } else {
                pendingCss = data.payload as CssPayload;
            }
        }

        // The admin (authenticated) renders the chosen theme's tokens and pushes them here, so the
        // preview can show a specific/draft theme without the iframe fetching the gated preview route.
        if (data.type === "wb.editor.sandbox.theme.css") {
            if (themeCssCallback) {
                themeCssCallback(data.payload as ThemeCssPayload);
            } else {
                pendingThemeCss = data.payload as ThemeCssPayload;
            }
        }

        // Light/dark toggle: the theme CSS carries both modes, so switching is just the :root attribute.
        if (data.type === "wb.editor.sandbox.theme.mode") {
            if (themeModeCallback) {
                themeModeCallback(data.payload as ThemeModePayload);
            } else {
                pendingThemeMode = data.payload as ThemeModePayload;
            }
        }
    });
}

interface ActiveComponent {
    hydrated: HydratedComponent;
    wrapped: Component;
}

export const ComponentSandbox = ({ components = [] }: ComponentSandboxProps) => {
    const [active, setActive] = useState<ActiveComponent | null>(null);
    const activeRef = useRef<ActiveComponent | null>(null);
    const [liveCss, setLiveCss] = useState("");
    const [themeCss, setThemeCss] = useState("");
    const [themeMode, setThemeMode] = useState("");

    // The previewed component's CSS references the theme's `--wby-*` tokens; make sure the active
    // theme's layer is present even if the host layout didn't emit it.
    useActiveThemeTokens();

    // Force the previewed light/dark mode by toggling the :root attribute the theme CSS keys its dark
    // values off; "" removes it, falling back to the theme's system default.
    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }
        const root = document.documentElement;
        if (themeMode === "light" || themeMode === "dark") {
            root.setAttribute(THEME_MODE_ATTRIBUTE, themeMode);
        } else {
            root.removeAttribute(THEME_MODE_ATTRIBUTE);
        }
    }, [themeMode]);

    const processBundle = useCallback((payload: BundlePayload) => {
        const entry = {
            id: payload.name,
            name: payload.name,
            label: payload.name,
            bundledJs: payload.bundledJs,
            bundledJsSha256: "",
            bundledCss: payload.bundledCss,
            bundledCssSha256: "",
            sdkVersion: "1",
            status: "published"
        };

        const hydrated = sdk.components.hydrateComponent(entry, { sdk: sdkNextjs, React });
        if (!hydrated) {
            return;
        }

        const wrapped: Component = {
            component: hydrated.component,
            manifest: hydrated.manifest
        };

        contentSdk.registerComponent(wrapped);

        const origin = getParentOrigin();
        if (origin) {
            window.parent.postMessage(
                { type: "wb.editor.preview.component.register", payload: hydrated.manifest },
                origin
            );
        }

        const state: ActiveComponent = { hydrated, wrapped };
        activeRef.current = state;
        setActive(state);
    }, []);

    useEffect(() => {
        bundleCallback = processBundle;
        cssCallback = (payload: CssPayload) => {
            setLiveCss(sdk.components.scopeCss(payload.css, payload.componentName));
        };
        themeCssCallback = (payload: ThemeCssPayload) => {
            setThemeCss(payload.css ?? "");
        };
        themeModeCallback = (payload: ThemeModePayload) => {
            setThemeMode(payload.mode ?? "");
        };

        if (pendingBundle) {
            processBundle(pendingBundle);
            pendingBundle = null;
        }

        if (pendingCss) {
            cssCallback(pendingCss);
            pendingCss = null;
        }

        if (pendingThemeCss) {
            themeCssCallback(pendingThemeCss);
            pendingThemeCss = null;
        }

        if (pendingThemeMode) {
            themeModeCallback(pendingThemeMode);
            pendingThemeMode = null;
        }

        return () => {
            bundleCallback = null;
            cssCallback = null;
            themeCssCallback = null;
            themeModeCallback = null;
        };
    }, [processBundle]);

    const current = active || activeRef.current;

    const allComponents = useMemo(() => {
        if (!current) {
            return components;
        }
        return [...components, current.wrapped];
    }, [components, current]);

    const css = liveCss || current?.hydrated.css || "";

    return (
        <>
            {/* The chosen theme's tokens, pushed by the admin. In the document after the active-theme
                <link>, so its :root values win — swapping the previewed theme with no reload. */}
            {themeCss ? (
                <style
                    data-wby-theme-preview="true"
                    dangerouslySetInnerHTML={{ __html: themeCss }}
                />
            ) : null}
            {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
            <DocumentRenderer document={SANDBOX_DOCUMENT} components={allComponents} />
        </>
    );
};

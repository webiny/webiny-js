"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as sdkNextjs from "./index.js";
import { sdk, type HydratedComponent } from "@webiny/sdk-frontend";
import { contentSdk, type Component, type Document } from "@webiny/website-builder-sdk";

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

interface BundlePayload {
    name: string;
    bundledJs: string;
    bundledCss: string;
}

interface CssPayload {
    css: string;
    componentName: string;
}

let pendingBundle: BundlePayload | null = null;
let pendingCss: CssPayload | null = null;
let bundleCallback: ((bundle: BundlePayload) => void) | null = null;
let cssCallback: ((payload: CssPayload) => void) | null = null;

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

        if (pendingBundle) {
            processBundle(pendingBundle);
            pendingBundle = null;
        }

        if (pendingCss) {
            cssCallback(pendingCss);
            pendingCss = null;
        }

        return () => {
            bundleCallback = null;
            cssCallback = null;
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
            {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
            <DocumentRenderer document={SANDBOX_DOCUMENT} components={allComponents} />
        </>
    );
};

"use client";
import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import type {
    ContentEntryInput,
    DocumentElement,
    DocumentElementBindings,
    OnResolved
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/website-builder-sdk";
import { ElementSlot } from "./ElementSlot.js";
import { useViewport } from "./useViewportInfo.js";
import { useBindingsForElement } from "./useBindingsForElement.js";
import { useDocumentState } from "./useDocumentState.js";
import { useContentEntryResolution } from "../contentEntry/ContentEntryResolutionContext.js";
import { contentEntryEditorCache } from "../contentEntry/contentEntryEditorCache.js";

interface LiveElementRendererProps {
    element: DocumentElement;
    bindings?: DocumentElementBindings;
}

// The empty shape shown for an autoLoad content-entry input until the editor
// cache resolves (matches the resolved shape per mode / cardinality).
const emptyResolved = (input: ContentEntryInput) => {
    if (input.mode === "query") {
        return { items: [], pageInfo: { cursor: null, hasMore: false, totalCount: 0 } };
    }
    return input.list ? [] : null;
};

export const LiveElementRenderer = observer(({ element }: LiveElementRendererProps) => {
    const viewport = useViewport();

    // 1. Start breakpoint as "desktop" on both server and initial client render.
    const [breakpoint, setBreakpoint] = useState<"desktop" | string>("desktop");

    // 2. Update breakpoint on the client after mount, using real viewport value.
    useEffect(() => {
        if (viewport.breakpoint && viewport.breakpoint !== breakpoint) {
            setBreakpoint(viewport.breakpoint);
        }
    }, [viewport.breakpoint, breakpoint]);

    // Bindings for current breakpoint
    const elementBindings = useBindingsForElement(element.id, breakpoint); // pass breakpoint explicitly if possible
    const state = useDocumentState();
    const contentEntryResolution = useContentEntryResolution();

    const onResolved = useCallback(
        ((value, input) => {
            if (input.type === "slot") {
                return (
                    <ElementSlot
                        key={element.id}
                        parentId={element.id}
                        slot={input.name}
                        elements={input.list ? value : [value]}
                    />
                );
            }
            if (input.type === "contentEntry") {
                const baseKey = `${element.id}:${input.name}`;
                const hasServerValue = baseKey in contentEntryResolution;
                const serverValue = contentEntryResolution[baseKey];

                // Editor preview: resolve reactively so the list updates as the
                // editor changes the selection/query, without a server round-trip.
                // Keyed by the raw value → an edit yields a fresh key + re-resolve.
                if (contentSdk.isEditing()) {
                    const cacheKey = `${baseKey}:${JSON.stringify(value ?? null)}`;
                    contentEntryEditorCache.resolve(cacheKey, input as ContentEntryInput, value);
                    const cached = contentEntryEditorCache.get(cacheKey);
                    if (cached !== undefined) {
                        return cached;
                    }
                    // Until it resolves, show the server-resolved value (no flash),
                    // otherwise an empty shape.
                    return hasServerValue ? serverValue : emptyResolved(input as ContentEntryInput);
                }

                // Live/SSR: use the server pre-pass result (fall back to the raw
                // value for autoLoad:false / unresolved).
                return hasServerValue ? serverValue : value;
            }
            return value;
        }) as OnResolved,
        [element.id, contentEntryResolution]
    );

    if (!element || !element.component) {
        return null;
    }

    const instances = contentSdk.resolveElement({
        element,
        state,
        elementBindings,
        onResolved
    });

    if (!instances) {
        return null;
    }

    return (
        <>
            {instances.map((resolvedElement, index) => {
                const { component: Component, inputs, styles, manifest } = resolvedElement;
                const props = { inputs, styles, element, breakpoint: viewport.breakpoint };
                const autoApplyStyles = manifest.autoApplyStyles !== false;

                const userElement = <Component key={element.id} {...props} />;

                if (!autoApplyStyles) {
                    return userElement;
                }

                return (
                    <div key={index} style={styles}>
                        {userElement}
                    </div>
                );
            })}
        </>
    );
});

"use client";
import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import type {
    DocumentElement,
    DocumentElementBindings,
    OnResolved
} from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/website-builder-sdk";
import { ElementSlot } from "./ElementSlot.js";
import { useViewport } from "./useViewportInfo.js";
import { useBindingsForElement } from "./useBindingsForElement.js";
import { useDocumentState } from "./useDocumentState.js";

interface LiveElementRendererProps {
    element: DocumentElement;
    bindings?: DocumentElementBindings;
}

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
            return value;
        }) as OnResolved,
        [element.id]
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

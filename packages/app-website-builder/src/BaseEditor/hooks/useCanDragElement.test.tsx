import React from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import type { CanDragElementParams } from "./useCanDragElement.js";
import { useCanDragElement } from "./useCanDragElement.js";

const box = { name: "Webiny/Box", canDrag: true } as ComponentManifest;
const fixed = { name: "Acme/Fixed", canDrag: false } as ComponentManifest;

function canDrag(params: CanDragElementParams, decorators: React.ComponentType[] = []) {
    return renderHook(() => useCanDragElement(params), {
        wrapper: ({ children }) => (
            <CompositionProvider>
                {decorators.map((Decorator, index) => (
                    <Decorator key={index} />
                ))}
                {children}
            </CompositionProvider>
        )
    }).result.current;
}

describe("useCanDragElement", () => {
    it("follows the manifest's canDrag by default", () => {
        expect(canDrag({ elementId: "a", componentManifest: box })).toBe(true);
        expect(canDrag({ elementId: "a", componentManifest: { name: "X" } as never })).toBe(true);
        expect(canDrag({ elementId: "a", componentManifest: fixed })).toBe(false);
    });

    it("lets a decorator stop the drag of one element, keeping the manifest's answer for others", () => {
        const LockFirst = useCanDragElement.createDecorator(original => {
            return function useLockFirst(params: CanDragElementParams) {
                return original(params) && params.elementId !== "first";
            };
        });

        expect(canDrag({ elementId: "first", componentManifest: box }, [LockFirst])).toBe(false);
        expect(canDrag({ elementId: "second", componentManifest: box }, [LockFirst])).toBe(true);
        expect(canDrag({ elementId: "second", componentManifest: fixed }, [LockFirst])).toBe(false);
    });
});

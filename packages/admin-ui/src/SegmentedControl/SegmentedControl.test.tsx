/**
 * This is a simple smoke test to verify the SegmentedControl component can be imported
 * and used without errors.
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { SegmentedControl } from "./SegmentedControl.js";

describe("SegmentedControl", () => {
    it("should export the component", () => {
        expect(SegmentedControl).toBeDefined();
    });

    it("should accept required props", () => {
        const items = [
            { label: "Item 1", value: "item1" },
            { label: "Item 2", value: "item2" }
        ];

        const props = {
            items,
            value: "item1",
            onChange: () => {}
        };

        // This should not throw
        expect(() => {
            React.createElement(SegmentedControl, props);
        }).not.toThrow();
    });
});

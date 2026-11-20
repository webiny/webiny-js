import { describe, it, expect } from "vitest";
import { LayoutContentArea } from "@webiny/website-builder-sdk";
import { getContentAreaLabel } from "./LayoutContentLabel.js";

const element = (id: string, name: string) => ({ id, component: { name } });

describe("getContentAreaLabel", () => {
    it('labels the main content area "Main content", and a named one by its own name, with no "Named content ·" prefix', () => {
        const main = LayoutContentArea.fromElement(element("content", "Webiny/LayoutContent"));
        const named = LayoutContentArea.fromElement(
            element("sidebar", "Webiny/NamedContent"),
            "sidebar"
        );

        expect(getContentAreaLabel(main)).toBe("Main content");
        expect(getContentAreaLabel(named)).toBe("sidebar");
    });

    it('labels a named content area without a name "Named content"', () => {
        const area = LayoutContentArea.fromElement(element("area", "Webiny/NamedContent"), "  ");

        expect(getContentAreaLabel(area)).toBe("Named content");
    });
});

import { describe, expect, it } from "vitest";
import { LayoutDocument } from "~/domain/layout/LayoutDocument.js";

describe("LayoutDocument.withGlobalPlacements", () => {
    it("gives every placement its own id, even when global names sanitize alike", () => {
        const existing = {
            type: "Webiny/Element",
            id: "placement-Demo-Header-1",
            component: { name: "Demo/Text" },
            parent: { id: "root", slot: "children" }
        };

        const document = LayoutDocument.from({
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Root" } },
                "placement-Demo-Header-1": existing
            },
            bindings: {
                root: {
                    inputs: {
                        children: {
                            type: "slot",
                            list: true,
                            static: [
                                "placement-Demo-Header-1",
                                "$global:Demo/Header",
                                "$global:Demo-Header"
                            ]
                        }
                    }
                }
            }
        }).withGlobalPlacements();

        expect(document.bindings.root.inputs.children.static).toEqual([
            "placement-Demo-Header-1",
            "placement-Demo-Header-2",
            "placement-Demo-Header-3"
        ]);
        expect(document.elements["placement-Demo-Header-1"]).toEqual(existing);
        expect(document.elements["placement-Demo-Header-2"].component.name).toBe("Demo/Header");
        expect(document.elements["placement-Demo-Header-3"].component.name).toBe("Demo-Header");
    });
});

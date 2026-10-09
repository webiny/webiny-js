import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode, PlannedComponent } from "~/domain/artifacts.js";
import { rebindComponent } from "./rebindComponent.js";

// A real stored artifact: Freehill Street Lofts' Contact Form with Map View as planned, and its
// representative section from the page tree after the input-label patch (2026-10-09).
const fixture = JSON.parse(
    readFileSync(
        new URL("./__fixtures__/freehill-contact-form.rebind.json", import.meta.url),
        "utf8"
    )
) as { component: PlannedComponent; section: CapturedNode };

describe("rebindComponent", () => {
    it("moves the form's submit from the phone link to its submit control, and nothing else", () => {
        const { component, moved } = rebindComponent(fixture.component, [fixture.section]);
        expect(moved.map(entry => entry.prop)).toEqual(["submitButton"]);
        expect(moved[0].before.values).toEqual(["Please Call (346) 489-6939"]);
        expect(moved[0].after.values).toEqual(["Send"]);
        const submit = component.props.find(prop => prop.name === "submitButton");
        expect(submit?.observedStructured).toEqual([
            { kind: "link", label: "Send", href: "", member: 0 }
        ]);
    });

    it("keeps the contract: the same props, names, types and token bindings", () => {
        const { component } = rebindComponent(fixture.component, [fixture.section]);
        expect(component.props.map(prop => [prop.name, prop.type, prop.array])).toEqual(
            fixture.component.props.map(prop => [prop.name, prop.type, prop.array])
        );
        expect(component.tokenBindings).toEqual(fixture.component.tokenBindings);
    });

    it("leaves the input untouched", () => {
        const before = JSON.stringify(fixture.component);
        rebindComponent(fixture.component, [fixture.section]);
        expect(JSON.stringify(fixture.component)).toBe(before);
    });
});

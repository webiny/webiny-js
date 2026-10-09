import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { keepStringValues } from "~/features/stages/plan/bindObservedValues.js";
import { sourceTextPool, validateNoInventedText, validateTextPreservation } from "./validators.js";

/*
 * webiny.com's "Docs site navigation header" as stored (2026-10-09): its `routeAnnouncer` prop carries
 * a `null` observed value. Lowercasing it crashed the component's generation after every model call,
 * unlogged, and the coordinator waited out two 8-minute timeouts before giving up.
 */
const planned = JSON.parse(
    readFileSync(new URL("./__fixtures__/webiny-docs-header.planned.json", import.meta.url), "utf8")
) as PlannedComponent;

describe("a stored plan with a null observed value", () => {
    it("is the fixture it claims to be", () => {
        const announcer = planned.props.find(prop => prop.name === "routeAnnouncer");
        expect(announcer?.observedValues).toContain(null);
    });

    it("no longer crashes the text checks", () => {
        const pool = sourceTextPool(planned);
        expect(pool.every(text => typeof text === "string")).toBe(true);
        expect(() => validateNoInventedText("<nav><a>Docs</a></nav>", pool)).not.toThrow();
        expect(() => validateTextPreservation(planned.sourceTexts ?? [], "Docs")).not.toThrow();
    });

    it("loses its null to keepStringValues, and keeps every string", () => {
        const props = keepStringValues(structuredClone(planned.props));
        const announcer = props.find(prop => prop.name === "routeAnnouncer");
        expect(announcer?.observedValues).not.toContain(null);
        const strings = planned.props
            .flatMap(prop => prop.observedValues)
            .filter(v => typeof v === "string");
        expect(props.flatMap(prop => prop.observedValues)).toEqual(strings);
    });
});

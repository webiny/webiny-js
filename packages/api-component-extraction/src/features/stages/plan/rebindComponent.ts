import type { CapturedNode, PlannedComponent } from "~/domain/artifacts.js";
import { bindObservedValues, textsOf } from "./bindObservedValues.js";
import { foldInlineLinks } from "./inlineLinks.js";
import { sectionUnboundImages } from "./sectionUnboundImages.js";

/**
 * Re-binds a planned component's observed values against its member sections, keeping its contract.
 *
 * A repair for stored runs, not a stage: no model call, so the props, their names and types, and the
 * token bindings stay exactly as planned. What the binder put in last time is taken out first — the
 * structured values, and the labels they added to `observedValues` — and the binder runs again on the
 * member nodes as they are now. Written for the demo runs' forms after their trees were patched with
 * the submit labels the capture had not read (`scripts/baseline/reports/2026-10-09/input-labels-patch.md`):
 * re-planning would have re-proposed every prop of those components; this changes only bound values.
 *
 * `nodes` are the member sections in the order Plan binds them: the representative first.
 */
export interface ReboundProp {
    prop: string;
    before: { values: string[]; structured: unknown[] };
    after: { values: string[]; structured: unknown[] };
}

/*
 * Values compared without the member that contributed them, and with sorted keys: a value bound again
 * from the same member is the same value, however its fields were written.
 */
const sortKeys = (_key: string, value: unknown): unknown =>
    value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value).sort(([x], [y]) => x.localeCompare(y)))
        : value;

const comparable = (snapshot: { values: string[]; structured: unknown[] }): string =>
    JSON.stringify(
        {
            values: snapshot.values,
            structured: snapshot.structured.map(value => {
                const { member: _member, ...rest } = value as Record<string, unknown>;
                return rest;
            })
        },
        sortKeys
    );

export const rebindComponent = (
    component: PlannedComponent,
    nodes: CapturedNode[]
): { component: PlannedComponent; moved: ReboundProp[] } => {
    const props = structuredClone(component.props);
    const snapshot = (prop: PlannedComponent["props"][number]) => ({
        values: [...prop.observedValues],
        structured: structuredClone(prop.observedStructured ?? []) as unknown[]
    });
    const before = new Map(props.map(prop => [prop.name, snapshot(prop)]));
    for (const prop of props) {
        const bound = new Set((prop.observedStructured ?? []).flatMap(textsOf));
        prop.observedValues = prop.observedValues.filter(value => !bound.has(value));
        delete prop.observedStructured;
    }
    if (nodes.length > 0) {
        bindObservedValues(nodes, props);
        // Links inside running text go back into their paragraph (inlineLinks.ts).
        foldInlineLinks(nodes, props);
    }
    const empty = { values: [], structured: [] };
    const moved = [
        ...props.map(prop => ({
            prop: prop.name,
            before: before.get(prop.name) ?? empty,
            after: snapshot(prop)
        })),
        // A Link prop the fold removed: every value it held went back into a paragraph.
        ...[...before.entries()]
            .filter(([name]) => !props.some(prop => prop.name === name))
            .map(([name, was]) => ({ prop: name, before: was, after: empty }))
    ].filter(entry => comparable(entry.before) !== comparable(entry.after));
    return {
        component: {
            ...component,
            props,
            unboundImages: nodes[0]
                ? sectionUnboundImages(nodes[0], props)
                : component.unboundImages
        },
        moved
    };
};

import {
    type DocumentBindings,
    ElementBindings,
    type ElementMap,
    type GlobalDocument,
    GlobalElementId
} from "@webiny/website-builder-sdk";

type Document = GlobalDocument;

/**
 * The layers an editor composes into the document it edits, for the elements the document doesn't own:
 *
 * - a global component's instance: its record (or manifest defaults) → the layout's override → the
 *   document's own override (a page's, or a layout's in the layout editor),
 * - in the page editor, the layout's own elements: the layout's bindings → the page's override.
 *
 * The edited document holds the effective bindings, so the preview and the sidebar work as for any other
 * element. When the document is saved, only its overrides are stored, under the element ids, in its own
 * `bindings`; instances are stored on their own.
 */
export interface OverrideLayersData {
    // Each global's instance below the document, keyed `$global:{name}`: its record, or its defaults.
    records: Record<string, Document>;
    // The bindings of the page's layout: its own elements', and its overrides of globals.
    layoutBindings: DocumentBindings;
    // Ids of the layout's own elements.
    layoutElementIds: string[];
    // The document's saved overrides of global instances, keyed by element id.
    own: DocumentBindings;
}

export const EMPTY_LAYERS: OverrideLayersData = {
    records: {},
    layoutBindings: {},
    layoutElementIds: [],
    own: {}
};

// The global (`$global:{name}`) whose instance holds an element, according to the stored records.
const findRecordOwner = (records: Record<string, Document>, id: string) => {
    if (GlobalElementId.isGlobal(id)) {
        return id;
    }

    for (const globalId in records) {
        if (records[globalId].elements[id]) {
            return globalId;
        }
    }

    return null;
};

/**
 * Split a document, as stored, into its own part and its overrides: bindings of elements it doesn't hold.
 * Overrides of the layout's own elements stay with the document's own part; the rest are overrides of
 * global instances.
 */
export const splitStoredOverrides = (
    document: Document,
    layoutElementIds: string[] = []
): { document: Document; own: DocumentBindings } => {
    const bindings: DocumentBindings = {};
    const own: DocumentBindings = {};

    for (const id in document.bindings) {
        if (document.elements[id] || layoutElementIds.includes(id)) {
            bindings[id] = document.bindings[id];
        } else {
            own[id] = document.bindings[id];
        }
    }

    return { document: { elements: document.elements, bindings }, own };
};

export class OverrideLayers {
    constructor(public readonly data: OverrideLayersData) {}

    with(data: Partial<OverrideLayersData>) {
        return new OverrideLayers({ ...this.data, ...data });
    }

    isLayoutElement(id: string) {
        return this.data.layoutElementIds.includes(id);
    }

    // The global whose instance holds an element: in the edited document, or else in the stored records.
    getGlobalId(elements: ElementMap, id: string) {
        return (
            GlobalElementId.rootOf(elements, id)?.toString() ??
            findRecordOwner(this.data.records, id)
        );
    }

    // What an element inherits from below the document.
    getInherited(id: string) {
        if (this.isLayoutElement(id)) {
            return this.data.layoutBindings[id];
        }

        const globalId = findRecordOwner(this.data.records, id);
        const record = globalId ? this.data.records[globalId]?.bindings[id] : undefined;
        return ElementBindings.from(record).mergeWith(this.data.layoutBindings[id]).toJSON();
    }

    // What an element shows: what it inherits, with the document's saved override on top.
    getEffective(id: string) {
        return ElementBindings.from(this.getInherited(id)).mergeWith(this.data.own[id]).toJSON();
    }

    // Ids of a global's instance: in its record, and in the edited document (which may have added some).
    getInstanceIds(document: Document, globalId: string) {
        const global = GlobalElementId.fromId(globalId);
        const ids = new Set<string>([globalId]);
        Object.keys(this.data.records[globalId]?.elements ?? {}).forEach(id => ids.add(id));
        Object.keys(document.elements).forEach(id => {
            if (global?.owns(document.elements, id)) {
                ids.add(id);
            }
        });
        return [...ids];
    }

    /**
     * Put a global's instance into a document, as the layers compose it: its record's elements, and the
     * effective bindings of each of them (and of overrides of elements it no longer has).
     */
    composeGlobal(document: Document, globalId: string) {
        const record = this.data.records[globalId];
        if (!record) {
            return;
        }

        // Elements added to the instance since are removed, with their bindings.
        const global = GlobalElementId.fromId(globalId);
        const added = this.getInstanceIds(document, globalId).filter(id => {
            return global?.owns(document.elements, id) && !record.elements[id];
        });
        added.forEach(id => {
            delete document.elements[id];
            delete document.bindings[id];
        });
        Object.assign(document.elements, structuredClone(record.elements));

        const ids = new Set<string>([
            ...Object.keys(record.bindings),
            ...Object.keys(this.data.own).filter(
                id => this.getGlobalId(document.elements, id) === globalId
            ),
            ...Object.keys(this.data.layoutBindings).filter(
                id =>
                    !this.isLayoutElement(id) && findRecordOwner(this.data.records, id) === globalId
            )
        ]);

        for (const id of ids) {
            const effective = this.getEffective(id);
            if (effective) {
                document.bindings[id] = structuredClone(effective);
            } else {
                delete document.bindings[id];
            }
        }
    }

    // Put the layout's own elements' effective bindings into the page: the layout's, with the page's override.
    composeLayoutElements(document: Document, pageOverrides: DocumentBindings) {
        for (const id of this.data.layoutElementIds) {
            const effective = ElementBindings.from(this.data.layoutBindings[id])
                .mergeWith(pageOverrides[id])
                .toJSON();
            if (effective) {
                document.bindings[id] = structuredClone(effective);
            }
        }
    }

    // Whether a global in the edited document differs from what the layers compose.
    hasChanges(document: Document, globalId: string) {
        return (
            this.hasStructureChanges(document, globalId) ||
            this.getInstanceIds(document, globalId).some(id => {
                return !isEqualJson(document.bindings[id], this.getEffective(id));
            })
        );
    }

    // Elements were added to, removed from or moved within a global's instance.
    hasStructureChanges(document: Document, globalId: string) {
        const record = this.data.records[globalId];
        if (!record) {
            return false;
        }

        const global = GlobalElementId.fromId(globalId);
        const current: ElementMap = {};
        Object.keys(document.elements).forEach(id => {
            if (global?.owns(document.elements, id)) {
                current[id] = document.elements[id];
            }
        });

        return !isEqualJson(current, record.elements);
    }

    // The overrides of a global the document would need to show it as it's edited.
    getDocumentOverrides(document: Document, globalId: string): DocumentBindings {
        const own: DocumentBindings = {};
        for (const id of this.getInstanceIds(document, globalId)) {
            const diff = ElementBindings.from(document.bindings[id])
                .diffFrom(this.getInherited(id))
                .toJSON();
            if (diff) {
                own[id] = diff;
            }
        }
        return own;
    }

    // The document's saved overrides of one global.
    getOwnFor(document: Document, globalId: string): DocumentBindings {
        const own: DocumentBindings = {};
        for (const id in this.data.own) {
            if (this.getGlobalId(document.elements, id) === globalId) {
                own[id] = this.data.own[id];
            }
        }
        return own;
    }

    // The unsaved changes of a global: what the edited document holds that the layers don't compose.
    getPendingChanges(document: Document, globalId: string): DocumentBindings {
        const pending: DocumentBindings = {};
        for (const id of this.getInstanceIds(document, globalId)) {
            const diff = ElementBindings.from(document.bindings[id])
                .diffFrom(this.getEffective(id))
                .toJSON();
            if (diff) {
                pending[id] = diff;
            }
        }
        return pending;
    }

    // Replace the document's overrides of one global.
    withOwnFor(document: Document, globalId: string, overrides: DocumentBindings) {
        const own: DocumentBindings = {};
        for (const id in this.data.own) {
            if (this.getGlobalId(document.elements, id) !== globalId) {
                own[id] = this.data.own[id];
            }
        }
        return this.with({ own: { ...own, ...overrides } });
    }

    /**
     * A global's record as edited: the edited instance's elements, and each element's record bindings with
     * the edited (unsaved) changes on top. The document's own overrides stay out of the record.
     */
    getEditedRecord(document: Document, globalId: string): Document {
        const elements: ElementMap = {};
        const bindings: DocumentBindings = {};
        const record = this.data.records[globalId];
        const pending = this.getPendingChanges(document, globalId);
        const global = GlobalElementId.fromId(globalId);

        for (const id of this.getInstanceIds(document, globalId)) {
            const element = document.elements[id];
            if (!element || !global?.owns(document.elements, id)) {
                continue;
            }

            elements[id] = id === globalId ? withoutParent(element) : element;

            const value = ElementBindings.from(record?.bindings[id])
                .mergeWith(pending[id])
                .toJSON();
            if (value) {
                bindings[id] = value;
            }
        }

        return structuredClone({ elements, bindings });
    }

    /**
     * The document as it's stored: without global instances, with the overrides of the layout's elements
     * (what differs from the layout), and with the saved overrides of globals.
     */
    toStored<T extends Document>(document: T): T {
        const { page } = GlobalElementId.splitDocument(document);
        const bindings: DocumentBindings = {};

        for (const id in page.bindings) {
            if (this.isLayoutElement(id)) {
                const diff = ElementBindings.from(page.bindings[id])
                    .diffFrom(this.data.layoutBindings[id])
                    .toJSON();
                if (diff) {
                    bindings[id] = diff;
                }
                continue;
            }
            bindings[id] = page.bindings[id];
        }

        for (const id in this.data.own) {
            if (!this.isLayoutElement(id)) {
                bindings[id] = this.data.own[id];
            }
        }

        return { ...document, elements: page.elements, bindings };
    }
}

const withoutParent = <T extends { parent?: unknown }>(element: T): T => {
    const { parent: _, ...rest } = element;
    return rest as T;
};

const isEqualJson = (a: unknown, b: unknown) => {
    return JSON.stringify(sortKeys(a ?? null)) === JSON.stringify(sortKeys(b ?? null));
};

const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.keys(value as Record<string, unknown>)
                .sort()
                .filter(key => (value as Record<string, unknown>)[key] !== undefined)
                .map(key => [key, sortKeys((value as Record<string, unknown>)[key])])
        );
    }
    return value;
};

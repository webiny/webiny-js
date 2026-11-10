import type { ComponentManifest, Document, GlobalDocument } from "./types.js";
import { ElementFactory } from "./ElementFactory.js";

/**
 * Ids for the elements and bindings of a default global instance. They are derived from the component
 * name, so every build of the same defaults yields the same ids: the server render and the client
 * hydration agree, and re-renders don't remount the global's children. The hyphens keep them apart
 * from generated ids, which use only lowercase letters and digits.
 * Every other character of the name is escaped as `_<hex code point>_`, so two different names never
 * share a prefix (`Demo/Header` and `Demo-Header` would both collapse to `Demo-Header` otherwise).
 */
const createDefaultIdGenerator = (componentName: string) => {
    const name = componentName.replace(/[^a-zA-Z0-9]/gu, char => {
        return `_${char.codePointAt(0)!.toString(16)}_`;
    });
    const prefix = `global-${name}`;
    let counter = 0;
    return () => `${prefix}-${++counter}`;
};

/**
 * Build the default instance of a global component (element + bindings) from its manifest defaults.
 * Used when a global exists in code but has no stored instance yet.
 */
export const createGlobalElementDocument = (
    componentName: string,
    components: Record<string, ComponentManifest>
): GlobalDocument => {
    const factory = new ElementFactory(components, createDefaultIdGenerator(componentName));
    const { operations } = factory.createGlobalElement(componentName);

    const document = { elements: {}, bindings: {} } as Document;
    operations.forEach(operation => operation.apply(document));

    return { elements: document.elements, bindings: document.bindings };
};

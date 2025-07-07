import { jsonPatch } from "~/sdk/jsonPatch";
import set from "lodash/set";
import type { Document, DocumentElementBindings } from "./types";
import type { IBindingsUpdater } from "./IBindingsUpdater";
import type { ElementStylesBindings } from "./StylesBindingsProcessor";

export class StylesUpdater implements IBindingsUpdater {
    private readonly bindings: ElementStylesBindings;
    private elementId: string;

    constructor(elementId: string, bindings: ElementStylesBindings) {
        this.elementId = elementId;
        this.bindings = bindings;
    }

    applyToDocument(document: Document) {
        if (this.bindings.styles) {
            document.bindings[this.elementId].styles = this.bindings.styles;
        }

        if (this.bindings.overrides) {
            for (const [bp, overrides] of Object.entries(this.bindings.overrides)) {
                if (overrides.styles) {
                    set(
                        document.bindings,
                        `${this.elementId}.overrides.${bp}.styles`,
                        structuredClone(this.bindings.overrides[bp].styles)
                    );
                }
            }
        }
    }

    createJsonPatch(bindings: DocumentElementBindings) {
        const toCompare: Partial<DocumentElementBindings> = { ...this.bindings };
        if (Object.keys(toCompare.overrides ?? {}).length === 0) {
            delete toCompare.overrides;
        }

        const ignore = ["/inputs", "/overrides/inputs", "/metadata"];

        return jsonPatch.compare(bindings, toCompare).filter(op => {
            return !ignore.some(prefix => op.path.startsWith(prefix));
        });
    }
}

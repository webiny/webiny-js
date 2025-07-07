import { jsonPatch } from "~/sdk/jsonPatch";
import set from "lodash/set";
import type { Document, DocumentElementBindings } from "./types";
import type { IBindingsUpdater } from "./IBindingsUpdater";
import type { ElementInputsBindings } from "./InputBindingsProcessor";
import { IDocumentOperation } from "~/sdk/documentOperations";

export class InputsUpdater implements IBindingsUpdater {
    private readonly bindings: ElementInputsBindings;
    private operations: IDocumentOperation[];
    private elementId: string;

    constructor(
        elementId: string,
        bindings: ElementInputsBindings,
        operations: IDocumentOperation[]
    ) {
        this.elementId = elementId;
        this.operations = operations;
        this.bindings = bindings;
    }

    applyToDocument(document: Document) {
        document.bindings[this.elementId].inputs = structuredClone(this.bindings.inputs);

        if (this.bindings.overrides) {
            for (const [bp, overrides] of Object.entries(this.bindings.overrides)) {
                if (overrides.inputs) {
                    set(
                        document.bindings,
                        `${this.elementId}.overrides.${bp}.inputs`,
                        structuredClone(this.bindings.overrides[bp].inputs)
                    );
                }
            }
        }

        this.operations.forEach(operation => operation.apply(document));
    }

    createJsonPatch(bindings: DocumentElementBindings) {
        const toCompare: Partial<DocumentElementBindings> = { ...this.bindings };
        if (Object.keys(toCompare.overrides ?? {}).length === 0) {
            delete toCompare.overrides;
        }

        const ignore = ["/styles", "/overrides/styles", "/metadata"];

        return jsonPatch.compare(bindings, toCompare).filter(op => {
            return !ignore.some(prefix => op.path.startsWith(prefix));
        });
    }
}

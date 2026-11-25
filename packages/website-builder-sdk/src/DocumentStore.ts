import { jsonPatch, type JsonPatchOperation } from "~/jsonPatch.js";
import type { Document } from "~/types.js";
import { makeAutoObservable, runInAction, observable, toJS } from "mobx";

export class DocumentStore<TDocument extends Document = Document> {
    private document: TDocument | null = null;
    private documentReady = false;
    private readyResolvers: (() => void)[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Puts `doc` in the store. A document already in it takes only the differences, value by
     * value, so a subscriber (an element's bindings) is notified only when its own part changed:
     * replacing whole objects would re-run every subscriber for any change.
     */
    setDocument(doc: TDocument) {
        runInAction(() => {
            if (this.document) {
                const changes = jsonPatch.compare(toJS(this.document), doc);
                if (changes.length) {
                    jsonPatch.applyPatch(this.document, changes, false, true);
                }
            } else {
                this.document = observable(doc);
            }
            this.documentReady = true;
            this.readyResolvers.forEach(fn => fn());
            this.readyResolvers = [];
        });
    }

    updateDocument(cb: (document: TDocument) => void) {
        runInAction(() => {
            if (this.document) {
                cb(this.document);
            }
        });
    }

    getDocument() {
        return this.document;
    }

    getElement(id: string) {
        if (!this.document) {
            return null;
        }

        return this.document.elements[id];
    }

    updateElement(id: string, patch: Partial<any>) {
        if (!this.document) {
            return;
        }

        const current = this.document.elements[id];
        if (current) {
            this.document.elements[id] = { ...current, ...patch };
        }
    }

    applyPatch(patch: JsonPatchOperation[]) {
        runInAction(() => {
            jsonPatch.applyPatch(this.document!, patch, false, true);
        });
    }

    async waitForDocument(): Promise<TDocument> {
        if (this.documentReady) {
            return this.document as TDocument;
        }

        return new Promise(resolve => {
            this.readyResolvers.push(() => {
                resolve(this.document as TDocument);
            });
        });
    }
}

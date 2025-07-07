import { jsonPatch, type JsonPatchOperation } from "~/sdk/jsonPatch";
import { makeAutoObservable, runInAction, observable } from "mobx";
import type { Document } from "~/sdk/types";

export class DocumentStore {
    private document: Document | null = null;
    private documentReady = false;
    private readyResolvers: (() => void)[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    setDocument(doc: Document) {
        runInAction(() => {
            if (this.document) {
                Object.assign(this.document, doc);
            } else {
                this.document = observable(doc);
            }
            this.documentReady = true;
            this.readyResolvers.forEach(fn => fn());
            this.readyResolvers = [];
        });
    }

    updateDocument(cb: (document: Document) => void) {
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

    async waitForDocument(): Promise<Document> {
        if (this.documentReady) {
            return this.document as Document;
        }

        return new Promise(resolve => {
            this.readyResolvers.push(() => {
                resolve(this.document as Document);
            });
        });
    }
}

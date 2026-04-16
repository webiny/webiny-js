// This file is identical to the React version — it is a pure-TypeScript MobX
// class with no framework-specific code, so it can be shared as-is.
"use client";
import { makeAutoObservable, observable, toJS } from "mobx";
import type { DocumentStore } from "@webiny/website-builder-sdk";
import {
    contentSdk,
    jsonPatch,
    type EditingSdk,
    type DocumentElement
} from "@webiny/website-builder-sdk";

export class EditingElementRendererPresenter {
    private element: DocumentElement;
    private listeners: Array<() => void> = [];
    private documentStore: DocumentStore;
    private readonly editingSdk: EditingSdk | undefined;

    constructor(documentStore: DocumentStore) {
        this.documentStore = documentStore;
        this.element = observable({}) as DocumentElement;
        this.editingSdk = contentSdk.getEditingSdk();
        makeAutoObservable(this);
    }

    get vm() {
        return {
            element: toJS(this.element)
        };
    }

    init(element: DocumentElement) {
        this.element = element;
        this.setupPreview();
    }

    dispose() {
        this.listeners.forEach(fn => fn());
    }

    private setupPreview() {
        const element = this.element;
        if (!element) return;

        const { id } = element;

        if (this.editingSdk) {
            this.listeners.push(
                this.editingSdk.messenger.on(`element.patch.${id}`, patch => {
                    this.documentStore.updateDocument(document => {
                        jsonPatch.applyPatch(document.bindings[id], patch, false, true);
                    });
                })
            );
        }
    }
}

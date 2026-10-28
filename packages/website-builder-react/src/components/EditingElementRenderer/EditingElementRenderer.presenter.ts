"use client";
import { makeAutoObservable, observable, toJS } from "mobx";
import type { DocumentStore } from "@webiny/website-builder-sdk";
import { jsonPatch, type EditingSdk, type DocumentElement } from "@webiny/website-builder-sdk";

export class EditingElementRendererPresenter {
    private element: DocumentElement;
    private listeners: Array<() => void> = [];
    private documentStore: DocumentStore;
    private readonly editingSdk: EditingSdk | undefined;

    constructor(documentStore: DocumentStore, editingSdk: EditingSdk | undefined) {
        this.documentStore = documentStore;
        this.element = observable({}) as DocumentElement;
        this.editingSdk = editingSdk;
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

        if (!element) {
            return;
        }

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

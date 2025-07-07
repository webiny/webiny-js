"use client";
import type { Component, ComponentGroup, IContentSdk, Page, ResolvedComponent } from "./types.js";
import { Messenger, MessageOrigin } from "./messenger";
import { logger } from "./Logger";
import { PreviewViewport } from "./PreviewViewport";
import { ViewportManager } from "./ViewportManager";
import { componentRegistry } from "./ComponentRegistry";
import { mouseTracker } from "./MouseTracker";
import { functionConverter } from "./FunctionConverter";
import { documentStoreManager } from "~/sdk/DocumentStoreManager";
import { DocumentStore } from "~/sdk/DocumentStore";
import { HotkeyManager } from "~/sdk/HotkeyManager";
import { ResolveElementParams } from "./ComponentResolver.js";

interface PreviewDocumentProps {
    id: string;
    [key: string]: string;
}

class PreviewDocument {
    public readonly props: Record<string, string>;

    constructor(props: PreviewDocumentProps) {
        this.props = props;
    }

    matches(params: Record<string, string>) {
        for (const [key, value] of Object.entries(params)) {
            if (this.props[key] !== value) {
                return false;
            }
        }
        return true;
    }

    getId() {
        return this.props.id;
    }
}

export class EditingSdk implements IContentSdk {
    private initialized = false;
    public readonly messenger: Messenger;
    private positionReportingEnabled = false;
    private previewViewport: PreviewViewport | null = null;
    private liveSdk: IContentSdk;
    private documentStore: DocumentStore;
    private previewDocument: PreviewDocument;
    private hotkeyManager: HotkeyManager;

    constructor(liveSdk: IContentSdk) {
        this.liveSdk = liveSdk;
        const source = new MessageOrigin(window, window.location.origin);
        const target = new MessageOrigin(window.parent, this.getReferrerOrigin());

        this.previewDocument = this.getPreviewDocument();

        this.documentStore = documentStoreManager.getStore(this.previewDocument.getId());

        this.messenger = new Messenger(source, target, "wb.editor.*");

        this.hotkeyManager = new HotkeyManager();

        componentRegistry.onRegister(reg => {
            this.messenger.send("preview.component.register", reg.component.manifest);
        });
    }

    public init(): void {
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        logger.info("Editing SDK initialized!");

        this.setupListeners();

        this.messenger.send("preview.ready", true);

        this.disableLinks();

        this.setupHotkeyListeners();
    }

    public async getPage(pathname: string): Promise<Page | null> {
        if (!this.previewDocument.matches({ type: "page", pathname })) {
            return this.liveSdk.getPage(pathname);
        }

        await this.documentStore.waitForDocument();
        return this.documentStore.getDocument();
    }

    public async listPages(): Promise<Page[]> {
        return this.liveSdk.listPages();
    }

    registerComponent(component: Component): void {
        componentRegistry.register(component);
    }

    registerComponentGroup(group: ComponentGroup) {
        this.messenger.send("preview.componentGroup.register", {
            ...group,
            filter: group.filter ? functionConverter.serialize(group.filter) : undefined
        });
    }

    resolveElement(params: ResolveElementParams): ResolvedComponent[] | null {
        return this.liveSdk.resolveElement(params);
    }

    private getReferrerOrigin(): string {
        try {
            const referrer = new URL(document.referrer);
            return `${referrer.protocol}//${referrer.host}`;
        } catch {
            return "";
        }
    }

    private setupListeners() {
        if (!this.messenger) {
            return;
        }

        this.messenger.on("document.set", data => {
            this.documentStore.setDocument(data);

            if (!this.positionReportingEnabled) {
                // Initialize position reporting
                this.initPositionReporting();
            } else {
                setTimeout(() => this.reportBoxes(), 20);
            }
        });

        this.messenger.on("element.set", data => {
            this.documentStore.updateElement(data.id, data.patch);
            setTimeout(() => {
                this.reportBoxes();
            }, 50);
        });

        this.messenger.on("document.patch", patch => {
            this.documentStore.applyPatch(patch);
            setTimeout(() => {
                this.reportBoxes();
            }, 50);
        });

        this.messenger.on("preview.element.positions.get", () => {
            this.reportBoxes();
        });

        this.messenger.on("preview.scroll", data => {
            window.scrollBy(data.deltaX, data.deltaY);
        });

        this.messenger.on("element.patch.*", () => {
            setTimeout(() => {
                this.reportBoxes();
            }, 50);
        });
    }

    private initPositionReporting(): void {
        if (this.positionReportingEnabled) {
            return;
        }

        // Initialize element positions tracker
        this.previewViewport = new PreviewViewport();

        // Add event listeners
        const viewportManager = new ViewportManager();

        viewportManager.onViewportChangeStart(() => {
            if (this.messenger) {
                this.messenger.send("preview.viewport.change.start");
            }
        });

        viewportManager.onViewportChangeEnd(() => {
            if (this.messenger) {
                this.messenger.send("preview.viewport.change.end");
                setTimeout(() => {
                    this.reportBoxes();
                }, 50);
            }
        });

        mouseTracker.start();
        mouseTracker.subscribe(position => {
            this.messenger.send("preview.mouse.move", position);
        });

        // Enable position reporting by default
        this.positionReportingEnabled = true;

        // Report initial positions after a short delay to ensure elements are rendered
        setTimeout(() => this.reportBoxes(), 500);
    }

    private reportBoxes(): void {
        if (!this.messenger || !this.previewViewport) {
            logger.warn("No messenger or preview viewport. Skipping position reporting.");
            return;
        }

        // Send positions to the editor
        this.messenger.send("preview.viewport", {
            boxes: this.previewViewport.getVisibleBoxes(),
            viewport: this.previewViewport.getViewport()
        });
    }

    private getPreviewDocument() {
        const search = new URLSearchParams(window.location.search);
        const result: Record<string, string> = {};
        const prefix = "wb.editing";

        for (const [key, value] of search.entries()) {
            if (key.startsWith(prefix + ".")) {
                const strippedKey = key.slice(prefix.length + 1); // +1 for the dot
                result[strippedKey] = value;
            }
        }

        if (!result.id) {
            throw new Error(
                "Editing document ID is required! Pass a `wb.editing.id` query parameter."
            );
        }

        return new PreviewDocument(result as PreviewDocumentProps);
    }

    private disableLinks() {
        // Intercept link clicks when we're in the editing mode (loaded via iframe from the editor).
        document.addEventListener(
            "click",
            event => {
                const target = event.target as HTMLElement;

                // Check if the clicked element or any of its ancestors is a link
                const anchor = target.closest("a");

                if (anchor && anchor.href) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            },
            // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#usecapture
            true
        );
    }

    private setupHotkeyListeners() {
        this.hotkeyManager.add("escape", e => {
            e.preventDefault();
            this.messenger.send("preview.escape");
        });

        this.hotkeyManager.add("mod+z", e => {
            e.preventDefault();
            this.messenger.send("preview.undo");
        });

        this.hotkeyManager.add("mod+shift+z", e => {
            e.preventDefault();
            this.messenger.send("preview.redo");
        });
    }
}

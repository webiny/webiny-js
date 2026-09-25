import { createAbstraction } from "@webiny/feature/admin";
import type { RemoteComponentDto } from "~/shared/types.js";

/** A published theme the author can preview a component under. */
export interface ThemeSummary {
    /** Revision id (`entryId#version`), the handle for fetching that version's snapshot. */
    id: string;
    version: number;
    name: string;
    status: string;
}

/** The source a theme version's preview CSS is rendered from. */
export interface ThemePreviewData {
    /** The published snapshot, or null on a draft that was never published. */
    resolved: unknown;
    /** The draft document, used to resolve a snapshot for an unpublished draft. */
    tokens: unknown;
    policy: unknown;
    settings: unknown;
}

export interface IRemoteComponentGateway {
    list(): Promise<{ items: RemoteComponentDto[]; meta: { totalCount: number } }>;
    get(id: string): Promise<RemoteComponentDto>;
    create(data: {
        name: string;
        label: string;
        description?: string;
        aiContext?: string;
        source: string;
        css?: string;
        aiPrompt?: string;
    }): Promise<RemoteComponentDto>;
    update(
        id: string,
        data: {
            name?: string;
            label?: string;
            description?: string;
            aiContext?: string;
            source?: string;
            css?: string;
            aiPrompt?: string;
        }
    ): Promise<RemoteComponentDto>;
    /**
     * Bundles a component on the server and returns it with the stored bundle and manifest.
     *
     * The editor cannot write a bundle itself — `update` has no field for one. Its local build is a
     * preview: it never leaves the browser, so there is no way for what a page renders to come from
     * a different derivation than the one the server ran.
     */
    bundle(id: string): Promise<RemoteComponentDto>;
    remove(id: string): Promise<boolean>;
    generate(
        prompt: string,
        options?: {
            name?: string;
            label?: string;
            description?: string;
            additionalFileIds?: string[];
        }
    ): Promise<{ id: string }>;
    refine(data: {
        currentSource: string;
        currentCss: string;
        feedback: string;
        additionalFileIds?: string[];
    }): Promise<void>;
    /** Published themes available to preview a component under. */
    listThemes(): Promise<ThemeSummary[]>;
    /** The CSS source (published snapshot, or the draft document) of a theme version. */
    getThemePreviewData(id: string): Promise<ThemePreviewData>;
    /** The active theme (name, version, colour scheme), or null when none is active. */
    getActiveTheme(): Promise<ActiveThemeSummary | null>;
}

/** The active theme, for labelling and gating the default "Active theme" preview. */
export interface ActiveThemeSummary {
    name: string;
    version: number;
    colorScheme: string;
}

export const RemoteComponentGateway = createAbstraction<IRemoteComponentGateway>(
    "RemoteComponents/Gateway"
);

export namespace RemoteComponentGateway {
    export type Interface = IRemoteComponentGateway;
}

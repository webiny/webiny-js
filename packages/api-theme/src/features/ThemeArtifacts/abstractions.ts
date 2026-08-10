import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Theme } from "~/domain/theme/abstractions.js";
import type { ThemeNotPublishableError } from "~/domain/theme/errors.js";

/** The three artifacts a published version exposes — see the design brief, section 6.2, and C6. */
export const ARTIFACT_FILES = ["tokens.css", "tokens.json", "manifest.json"] as const;

export type ArtifactFile = (typeof ARTIFACT_FILES)[number];

export const isArtifactFile = (value: string): value is ArtifactFile => {
    return (ARTIFACT_FILES as readonly string[]).includes(value);
};

export interface RenderedArtifact {
    contentType: string;
    body: string;
    /**
     * True when the artifact came from a frozen snapshot and can therefore be cached forever.
     * A draft is rendered on demand and must not be cached.
     */
    immutable: boolean;
}

export interface IThemeArtifactService {
    /**
     * Renders one artifact for a theme version.
     *
     * For a published version this is a pure projection of the frozen snapshot. For a draft the
     * snapshot is produced on demand, which is what makes the preview contract in section 6.5
     * possible — and which fails with the blocker list if the draft is not yet valid.
     */
    render(theme: Theme, file: ArtifactFile): Result<RenderedArtifact, ThemeNotPublishableError>;
}

export const ThemeArtifactService = createAbstraction<IThemeArtifactService>(
    "Theme/ThemeArtifactService"
);

export namespace ThemeArtifactService {
    export type Interface = IThemeArtifactService;
    export type File = ArtifactFile;
    export type Rendered = RenderedArtifact;
}

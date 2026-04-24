import slugify from "slugify";

/**
 * Value object for page path manipulation.
 * Handles slugification and language code prefixing.
 * Mirrors the API-side PagePath but tailored for admin form logic.
 */
export class PagePath {
    private readonly path: string;

    private constructor(path: string) {
        this.path = path;
    }

    static create(path: string): PagePath {
        return new PagePath(path);
    }

    static fromTitle(title: string): PagePath {
        const slug = slugify(title, {
            replacement: "-",
            lower: true,
            remove: /[*#?<>_{}[\]+~.()'"!:;@]/g,
            trim: false
        });
        return new PagePath("/" + slug);
    }

    /**
     * Normalizes the path: ensures leading slash, lowercases, removes invalid characters.
     */
    slugify(): PagePath {
        if (this.path === "") {
            return new PagePath("");
        }

        const str = this.path
            .replace(/^\//, "")
            .toLowerCase()
            .replace(/[^a-z0-9/-]+/g, "-")
            .replace(/^-|-$/g, "");
        return new PagePath("/" + str);
    }

    /**
     * Replaces or prepends a language code segment.
     * If the first path segment is a known language code, it gets replaced.
     * Otherwise the new code is prepended.
     */
    setLanguageCode(code: string, supportedCodes: string[]): PagePath {
        const normalized = this.ensureLeadingSlash();

        if (normalized === "/") {
            return new PagePath("/" + code);
        }

        const segments = normalized.split("/").filter(Boolean);
        const firstSegment = segments[0];

        if (supportedCodes.includes(firstSegment)) {
            segments[0] = code;
            return new PagePath("/" + segments.join("/"));
        }

        return new PagePath("/" + code + normalized);
    }

    /**
     * Strips the language code prefix if the first segment is a known code.
     */
    stripLanguageCode(supportedCodes: string[]): PagePath {
        const normalized = this.ensureLeadingSlash();
        const segments = normalized.split("/").filter(Boolean);
        const firstSegment = segments[0];

        if (firstSegment && supportedCodes.includes(firstSegment)) {
            const rest = segments.slice(1);
            return new PagePath(rest.length > 0 ? "/" + rest.join("/") : "/");
        }

        return new PagePath(normalized);
    }

    /**
     * Returns true if this path has meaningful content beyond just "/" or a language prefix.
     */
    hasContent(supportedCodes: string[] = []): boolean {
        const stripped = this.stripLanguageCode(supportedCodes);
        return stripped.toString() !== "/" && stripped.toString() !== "";
    }

    isEmpty(): boolean {
        return !this.path || this.path === "/";
    }

    toString(): string {
        return this.path;
    }

    private ensureLeadingSlash(): string {
        return this.path.startsWith("/") ? this.path : "/" + this.path;
    }
}

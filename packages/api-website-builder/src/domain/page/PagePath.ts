export class PagePath {
    private readonly path: string;

    private constructor(path: string) {
        this.path = path;
    }

    static create(path: string): PagePath {
        return new PagePath(path);
    }

    setLanguageCode(code: string, supportedCodes: string[]): PagePath {
        if (!supportedCodes.includes(code)) {
            throw new Error(`Language code "${code}" is not in supported codes`);
        }

        const normalized = this.path.startsWith("/") ? this.path : `/${this.path}`;

        // Handle root path.
        if (normalized === "/") {
            return new PagePath(`/${code}`);
        }

        // Check if path starts with a supported language code.
        const pathSegments = normalized.split("/").filter(Boolean);
        const firstSegment = pathSegments[0];

        if (supportedCodes.includes(firstSegment)) {
            // Replace existing language code.
            pathSegments[0] = code;
            return new PagePath(`/${pathSegments.join("/")}`);
        }

        // No language code present, prepend the new one.
        return new PagePath(`/${code}${normalized}`);
    }

    toString(): string {
        return this.path;
    }
}

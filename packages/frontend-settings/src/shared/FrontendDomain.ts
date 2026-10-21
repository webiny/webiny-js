/**
 * The domain the frontend is served from. It is loaded into preview iframes, so it has to be an
 * http(s) URL. An empty value is allowed and means "use the default domain".
 */
export class FrontendDomain {
    static readonly ALLOWED_PROTOCOLS: readonly string[] = ["http:", "https:"];

    private constructor(private readonly value: string) {}

    static from(value: string): FrontendDomain {
        return new FrontendDomain(value);
    }

    isEmpty(): boolean {
        return this.value === "";
    }

    isValid(): boolean {
        if (this.isEmpty()) {
            return true;
        }

        if (!URL.canParse(this.value)) {
            return false;
        }

        const { protocol } = new URL(this.value);
        return FrontendDomain.ALLOWED_PROTOCOLS.includes(protocol);
    }

    toString(): string {
        return this.value;
    }
}

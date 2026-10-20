import { BaseError } from "@webiny/feature/api";

export class InvalidFrontendDomainError extends BaseError {
    override readonly code = "FrontendSettings/InvalidDomain" as const;

    constructor(domain: string) {
        super({
            message: `"${domain}" is not a valid frontend domain. Use an http:// or https:// URL.`
        });
    }
}

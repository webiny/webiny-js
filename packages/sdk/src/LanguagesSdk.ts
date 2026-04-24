import type { WebinyConfig } from "./types.js";
import type { HttpError, GraphQLError, NetworkError } from "./errors.js";
import type { Result } from "./Result.js";
import type { Language } from "./methods/languages/listLanguages.js";
import { listLanguages as listLanguagesFn } from "./methods/languages/listLanguages.js";

export class LanguagesSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async listLanguages(): Promise<Result<Language[], HttpError | GraphQLError | NetworkError>> {
        return listLanguagesFn(this.config, this.fetchFn);
    }
}

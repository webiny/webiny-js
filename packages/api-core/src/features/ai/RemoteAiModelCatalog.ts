import { z } from "zod";
import { createImplementation } from "@webiny/feature/api";
import { getWcpApiUrl } from "@webiny/wcp";
import { AiModelCatalog as AiModelCatalogAbstraction } from "./abstractions.js";
import type { AiCatalogProvider } from "./abstractions.js";
import { Logger } from "~/features/logger/index.js";

const FETCH_TIMEOUT_MS = 3000;
const SUCCESS_TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;

const optionalDate = z.coerce.date().optional();

const catalogSchema = z.object({
    providers: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            models: z.array(
                z.object({
                    id: z.string(),
                    name: z.string(),
                    deprecated: optionalDate,
                    endOfLife: optionalDate
                })
            )
        })
    )
});

interface CachedCatalog {
    expiresAt: number;
    providers: Promise<AiCatalogProvider[] | undefined>;
}

/*
 * Process-wide on purpose: the catalog is the same for every tenant and request, and
 * `Ai.resolveLanguageModel()` reads it on every call, so a warm Lambda should fetch it once.
 */
let cached: CachedCatalog | undefined;

class RemoteAiModelCatalogImpl implements AiModelCatalogAbstraction.Interface {
    constructor(private readonly logger: Logger.Interface) {}

    listProviders(): Promise<AiCatalogProvider[] | undefined> {
        if (cached && cached.expiresAt > Date.now()) {
            return cached.providers;
        }

        const entry: CachedCatalog = {
            expiresAt: Date.now() + SUCCESS_TTL_MS,
            providers: this.fetchProviders().then(providers => {
                if (!providers) {
                    entry.expiresAt = Date.now() + FAILURE_TTL_MS;
                }
                return providers;
            })
        };
        cached = entry;

        return entry.providers;
    }

    private async fetchProviders(): Promise<AiCatalogProvider[] | undefined> {
        const url = getWcpApiUrl("/ai/models");

        try {
            const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
            const response = await fetch(url, { signal });
            if (!response.ok) {
                this.logger.warn({ url, status: response.status }, "Failed to load AI models.");
                return undefined;
            }

            const body: unknown = await response.json();
            const result = catalogSchema.safeParse(body);
            if (!result.success) {
                this.logger.warn({ url, error: result.error }, "Received invalid AI models.");
                return undefined;
            }

            return result.data.providers;
        } catch (error) {
            this.logger.warn({ url, error }, "Failed to load AI models.");
            return undefined;
        }
    }
}

export const RemoteAiModelCatalog = createImplementation({
    abstraction: AiModelCatalogAbstraction,
    implementation: RemoteAiModelCatalogImpl,
    dependencies: [Logger]
});

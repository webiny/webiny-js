import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

// The Website Builder settings live under this key in the shared key-value store (source of truth:
// `WEBSITE_BUILDER_SETTINGS` in `@webiny/api-website-builder`). Duplicated as a literal rather than
// taken as a package dependency for one constant; the component render only reads it.
const WEBSITE_BUILDER_SETTINGS = "WebsiteBuilder/Settings";
const DEFAULT_PREVIEW_DOMAIN = "http://localhost:3000";

/**
 * Resolves the deployed website's origin — the host of the `/sandbox/component` render route the
 * rendered-component screenshot navigates to. Same source the Website Builder editor's preview iframe
 * reads, so a component screenshots against the same site the admin previews it on.
 */
export interface IPreviewDomainResolver {
    resolve(): Promise<Result<string, ExtractionError>>;
}

export const PreviewDomainResolver = createAbstraction<IPreviewDomainResolver>(
    "ComponentExtraction/PreviewDomainResolver"
);
export namespace PreviewDomainResolver {
    export type Interface = IPreviewDomainResolver;
}

class PreviewDomainResolverImpl implements IPreviewDomainResolver {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async resolve(): Promise<Result<string, ExtractionError>> {
        const result = await this.keyValueStore.get<{ previewDomain?: string }>(
            WEBSITE_BUILDER_SETTINGS
        );
        const domain = (result.isOk() && result.value?.previewDomain) || DEFAULT_PREVIEW_DOMAIN;

        // A trailing slash would double up against the route path; normalise it away.
        const normalized = domain.replace(/\/+$/, "");
        if (!/^https?:\/\//.test(normalized)) {
            return Result.fail(
                new ExtractionValidationError(
                    `the Website Builder preview domain "${normalized}" is not a valid http(s) origin`
                )
            );
        }
        return Result.ok(normalized);
    }
}

export const PreviewDomainResolverService = createImplementation({
    abstraction: PreviewDomainResolver,
    implementation: PreviewDomainResolverImpl,
    dependencies: [KeyValueStore]
});

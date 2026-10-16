import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { IReviewRowBinding } from "~/review/presentation/reviewList/abstractions.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";

/*
 * Binds the shared list to one app: its use cases and its content adapter. Exported as a plain
 * class on purpose; each app subclasses it in its own file and binds the subclass with
 * `createImplementation`, so two apps never share one class's metadata.
 */
export class AppReviewRowProvider implements IReviewRowProvider {
    private readonly binding: IReviewRowBinding;

    constructor(
        useCases: IReviewUseCases,
        private adapter: IReviewContentAdapter
    ) {
        this.binding = {
            useCases,
            getContentUrl: ref => this.adapter.getContentUrl(ref),
            getContentTypeLabel: contentTypeId => this.adapter.getContentTypeLabel(contentTypeId)
        };
    }

    getBinding(namespace: string): IReviewRowBinding | null {
        if (!this.adapter.canHandle(namespace)) {
            return null;
        }
        return this.binding;
    }
}

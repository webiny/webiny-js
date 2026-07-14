import { EntriesBulkAction } from "webiny/api/cms/bulk-actions";
import {
    GetLatestRevisionByEntryIdUseCase,
    ListLatestEntriesUseCase,
    UpdateEntryUseCase
} from "webiny/api/cms/entry";

/**
 * "Apply Discount" bulk action.
 *
 * This is a regular Headless CMS bulk action, but the key thing to notice is what
 * Webiny does with it: for every registered `EntriesBulkAction`, the framework
 * automatically generates a background task (`hcmsBulkListApplyDiscountEntries` /
 * `hcmsBulkProcessApplyDiscountEntries`) and a GraphQL mutation. So the two methods
 * below ARE the background task body:
 *
 *   - `loadData`    → runs in the "list" task, paginating over the matching entries.
 *   - `processData` → runs in the "process" task, once per entry, in batches.
 *
 * Nothing here schedules, chunks, retries, or resumes on timeout — that machinery is
 * provided by the tasks system. We only describe WHAT to do to each entry.
 */
const DEFAULT_DISCOUNT_PERCENT = 10;

class ApplyDiscountBulkActionImpl implements EntriesBulkAction.Interface {
    // The action name. Webiny PascalCases it into the task id + GraphQL enum value,
    // so "applyDiscount" → tasks `hcmsBulk(List|Process)ApplyDiscountEntries` and the
    // frontend triggers it with `action: "ApplyDiscount"`.
    public readonly name = "applyDiscount";

    // Only expose this bulk action on the "product" model.
    public readonly modelIds = ["product"];

    public constructor(
        private readonly listLatestEntries: ListLatestEntriesUseCase.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private readonly updateEntry: UpdateEntryUseCase.Interface
    ) {}

    /**
     * Collect the entries the task will operate on. `params.where` already contains the
     * selection scope sent from the Admin UI (see the frontend button), so we just pass
     * it through to the standard "list latest entries" use case.
     */
    public async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const result = await this.listLatestEntries.execute(model, params);
        return result.value;
    }

    /**
     * Apply the discount to a single entry. Throwing marks this entry as "failed" in the
     * task report; returning marks it "done".
     */
    public async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams
    ): Promise<void> {
        const percent = Number(params.data?.percent) || DEFAULT_DISCOUNT_PERCENT;

        // `params.id` is a revision id (e.g. "<entryId>#0001"); strip the version.
        const entryId = params.id.split("#")[0];

        const revision = await this.getLatestRevision.execute(model, { id: entryId });
        if (revision.isFail()) {
            throw revision.error;
        }

        const entry = revision.value;
        const currentPrice = Number(entry.values.price) || 0;

        // Discount and round to 2 decimals.
        const newPrice = Math.round(currentPrice * (1 - percent / 100) * 100) / 100;

        const updated = await this.updateEntry.execute(model, entry.id, {
            values: { price: newPrice }
        });
        if (updated.isFail()) {
            throw updated.error;
        }
    }
}

export default EntriesBulkAction.createImplementation({
    implementation: ApplyDiscountBulkActionImpl,
    dependencies: [ListLatestEntriesUseCase, GetLatestRevisionByEntryIdUseCase, UpdateEntryUseCase]
});

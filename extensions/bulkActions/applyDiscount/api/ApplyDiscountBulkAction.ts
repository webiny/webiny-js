import {
    EntriesBulkAction,
    GetLatestRevisionByEntryIdUseCase,
    ListLatestEntriesUseCase,
    UpdateEntryUseCase
} from "webiny/api/cms/entry";
import { Logger, WebsocketsSendToIdentityUseCase } from "webiny/api";
import { IdentityContext } from "webiny/api/security";

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

// The `data` payload the Admin action sends with each trigger.
interface ApplyDiscountData {
    percent?: number;
}

class ApplyDiscountBulkActionImpl implements EntriesBulkAction.Interface<ApplyDiscountData> {
    // The action name. Webiny PascalCases it into the task id + GraphQL enum value,
    // so "applyDiscount" → tasks `hcmsBulk(List|Process)ApplyDiscountEntries` and the
    // frontend triggers it with `action: "ApplyDiscount"`.
    public readonly name = "applyDiscount";

    // Only expose this bulk action on the "product" model.
    public readonly modelIds = ["product"];

    public constructor(
        private readonly listLatestEntries: ListLatestEntriesUseCase.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private readonly updateEntry: UpdateEntryUseCase.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly sendToIdentity: WebsocketsSendToIdentityUseCase.Interface,
        private readonly logger: Logger.Interface
    ) {}

    /**
     * Collect the entries the task will operate on. `params.where` already contains the
     * selection scope sent from the Admin UI (see the frontend button).
     *
     * IMPORTANT: the tasks engine calls `loadData` repeatedly until it returns zero
     * entries — after each processing round it re-lists to check for more work. So the
     * filter MUST exclude already-processed entries, otherwise the task never converges
     * (it would re-discount the same products forever and eventually hit maxIterations).
     * We exclude anything already `onSale`; `processData` flips that flag.
     */
    public async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        // The bulk-action list path talks to storage directly, bypassing the GraphQL
        // where-transform. At the storage layer, custom fields are namespaced under
        // `values.` (system fields like `id` stay top-level), so we must write the filter
        // as `values.onSale_not` — a bare `onSale_not` can't be resolved and throws
        // "There is no field with the fieldId onSale".
        const where: Record<string, unknown> = { ...params.where, "values.onSale_not": true };
        const result = await this.listLatestEntries.execute(model, { ...params, where });
        return result.value;
    }

    /**
     * Apply the discount to a single entry. Throwing marks this entry as "failed" in the
     * task report; returning marks it "done".
     */
    public async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams<ApplyDiscountData>
    ): Promise<void> {
        const percent = params.data?.percent ?? DEFAULT_DISCOUNT_PERCENT;

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

        // Flip `onSale` so the entry is excluded from the next `loadData` round — this is
        // what lets the background task converge and finish.
        //
        // `skipValidation` because this is a targeted, system-driven field update: we only
        // touch `price`/`onSale`, and it shouldn't fail just because some unrelated field
        // on the entry is empty/invalid. Full validation still runs when a human edits the
        // entry in the Admin app.
        const updated = await this.updateEntry.execute(
            model,
            entry.id,
            { values: { price: newPrice, onSale: true } },
            { skipValidation: true }
        );
        if (updated.isFail()) {
            throw updated.error;
        }

        // Notify the user who triggered the action, in real time. Best-effort: a websocket
        // failure must never fail the discount itself, so we swallow errors here.
        try {
            const identity = this.identityContext.getIdentity();
            if (identity) {
                await this.sendToIdentity.execute(
                    { id: identity.id },
                    {
                        action: "cms.product.discountApplied",
                        data: {
                            id: entry.entryId,
                            price: newPrice,
                            percent
                        }
                    }
                );
            }
        } catch (ex) {
            const message = ex instanceof Error ? ex.message : String(ex);
            this.logger.warn(`[ApplyDiscount] websocket notification failed: ${message}`);
        }
    }
}

export default EntriesBulkAction.createImplementation({
    implementation: ApplyDiscountBulkActionImpl,
    dependencies: [
        ListLatestEntriesUseCase,
        GetLatestRevisionByEntryIdUseCase,
        UpdateEntryUseCase,
        IdentityContext,
        WebsocketsSendToIdentityUseCase,
        Logger
    ]
});

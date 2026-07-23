import {
    EntriesBulkAction,
    GetLatestRevisionByEntryIdUseCase,
    ListLatestEntriesUseCase,
    UpdateEntryUseCase
} from "webiny/api/cms/entry";
import { CmsGenerateEntryContentUseCase } from "webiny/api/ai-powerups";
import { Logger, WebsocketsSendToIdentityUseCase } from "webiny/api";
import { IdentityContext } from "webiny/api/security";

/**
 * "Generate AI summary" bulk action.
 *
 * Same shape as any bulk action (two methods → Webiny runs it as a background task), but
 * `processData` delegates the actual generation to AI Power Ups' `CmsGenerateEntryContentUseCase`.
 * That use case uses the provider the user configured in AI Power Ups settings and applies
 * an optional Writer Persona (the user's own instructions/tone) — so we don't pick models,
 * decrypt keys, or hardcode a persona here. We just say "summarize this product" and write
 * the result back.
 *
 * AI-per-entry is a natural background-task workload: slow, batched, resumable.
 */
// The `data` payload the Admin action sends with each trigger.
interface GenerateAiSummaryData {
    projectId?: string;
    writerPersonaId?: string;
    readerPersonaId?: string;
    runId?: string;
}

class GenerateAiSummaryBulkAction implements EntriesBulkAction.Interface<GenerateAiSummaryData> {
    name = "generateAiSummary";
    modelIds = ["product"];

    constructor(
        private readonly listEntries: ListLatestEntriesUseCase.Interface,
        private readonly getRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private readonly updateEntry: UpdateEntryUseCase.Interface,
        private readonly generateContent: CmsGenerateEntryContentUseCase.Interface,
        private readonly logger: Logger.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    // Convergence is handled by the run-token filter the Admin action puts in `where`
    // (`values: { aiSummarizedRun_not: <runId> }`): once an entry is stamped with the
    // current run it drops out, so the task ends — but a NEW run uses a new token, so the
    // same entries qualify again and get re-summarized.
    //
    // The GraphQL where arrives with custom-field filters nested under `values`, but the
    // storage layer wants flat dotted keys (`values.<field>`), so we flatten here.
    async loadData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.LoadDataParams
    ): Promise<EntriesBulkAction.LoadDataResult> {
        const where: Record<string, unknown> = { ...params.where };
        if (where.values && typeof where.values === "object") {
            for (const [key, value] of Object.entries(where.values as Record<string, unknown>)) {
                where[`values.${key}`] = value;
            }
            delete where.values;
        }
        return (await this.listEntries.execute(model, { ...params, where })).value;
    }

    async processData(
        model: EntriesBulkAction.Model,
        params: EntriesBulkAction.ProcessParams<GenerateAiSummaryData>
    ): Promise<void> {
        const entryId = params.id.split("#")[0];
        const revision = await this.getRevision.execute(model, { id: entryId });
        if (revision.isFail()) {
            throw revision.error;
        }
        const entry = revision.value;

        // Optional AI Power Ups context, forwarded from the Admin action's `data`:
        // a Writer Persona (tone), a Reader Persona (audience), or a Project (a bundled
        // prompting context with its own instructions + default personas). The per-run
        // `runId` token is what lets this run converge (a new run uses a new token).
        const { projectId, writerPersonaId, readerPersonaId, runId = "" } = params.data ?? {};

        const result = await this.generateContent.execute({
            modelId: model.modelId,
            prompt: `Write a concise, single-sentence marketing summary for the product "${entry.values.name}". Fill only the "aiSummary" field.`,
            writerPersonaId,
            readerPersonaId,
            projectId
        });
        if (result.isFail()) {
            throw result.error;
        }

        // The use case returns the generated entry as a JSON string; take our field.
        const generated = JSON.parse(result.value.output || "{}").aiSummary;
        const aiSummary = typeof generated === "string" ? generated : "";

        if (!aiSummary) {
            this.logger.warn(
                `[GenerateAiSummary] empty summary for entry ${entry.id}; marking as done to converge.`
            );
        }

        const updated = await this.updateEntry.execute(
            model,
            entry.id,
            { values: { aiSummary, aiSummarizedRun: runId } },
            { skipValidation: true }
        );
        if (updated.isFail()) {
            throw updated.error;
        }

        // Notify the triggering user in real time (best-effort — never fail the task on a
        // websocket error).
        try {
            const identity = this.identityContext.getIdentity();
            if (identity) {
                await this.sendToIdentity.execute(
                    { id: identity.id },
                    {
                        action: "cms.product.aiSummaryGenerated",
                        data: { id: entry.entryId, name: entry.values.name, aiSummary }
                    }
                );
            }
        } catch (ex) {
            const message = ex instanceof Error ? ex.message : String(ex);
            this.logger.warn(`[GenerateAiSummary] websocket notification failed: ${message}`);
        }
    }
}

export default EntriesBulkAction.createImplementation({
    implementation: GenerateAiSummaryBulkAction,
    dependencies: [
        ListLatestEntriesUseCase,
        GetLatestRevisionByEntryIdUseCase,
        UpdateEntryUseCase,
        CmsGenerateEntryContentUseCase,
        Logger,
        IdentityContext,
        WebsocketsSendToIdentityUseCase
    ]
});

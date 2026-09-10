/**
 * This extension decorates CmsModelOpenSearchIndex to control per-model index isolation.
 *
 * By default, when OPENSEARCH_SHARED_INDEXES=true, all tenants share a single
 * OpenSearch index per model. This decorator overrides that behavior for
 * user-created models (non-plugin) created after a specific cutoff date,
 * forcing them into per-tenant indexes.
 *
 * Behavior:
 * - Plugin models (isPlugin: true) — unchanged, uses system defaults.
 * - User models created BEFORE the cutoff — unchanged, keeps shared indexes.
 * - User models created ON or AFTER the cutoff — forces shared: false,
 *   giving each tenant its own index for that model.
 */
import { CmsModelOpenSearchIndex } from "webiny/api/cms/opensearch";

// Models created before this date keep existing shared index behavior.
// Models created on or after this date get per-tenant indexes.
const ISOLATION_CUTOFF = new Date("2026-07-20T00:00:00.000Z");

class PerModelIndexIsolationImpl implements CmsModelOpenSearchIndex.Interface {
    constructor(private original: CmsModelOpenSearchIndex.Interface) {}

    async execute(params: CmsModelOpenSearchIndex.Params): Promise<CmsModelOpenSearchIndex.Result> {
        // Get the default index configuration (shared flag, settings).
        const result = await this.original.execute(params);
        const { model } = params;

        // Plugin models are system-defined + Kibo code models — don't override their index behavior.
        if (model.isPlugin) {
            return result;
        }

        // For user-created models after the cutoff, disable sharing
        // so each tenant gets its own OpenSearch index.
        const createdOn = model.createdOn ? new Date(model.createdOn) : null;
        if (createdOn && createdOn >= ISOLATION_CUTOFF) {
            return { ...result, shared: false };
        }

        return result;
    }
}

export const PerModelIndexIsolation = CmsModelOpenSearchIndex.createDecorator({
    decorator: PerModelIndexIsolationImpl,
    dependencies: []
});

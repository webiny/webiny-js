import type { CmsEntry } from "@webiny/api-headless-cms/types";
import type {
    CmsEntryWbExperimentValues,
    ExperimentStatus,
    WbExperiment
} from "~/domain/experiment/abstractions.js";

export class EntryToExperimentMapper {
    static toExperiment(entry: CmsEntry<CmsEntryWbExperimentValues>): WbExperiment {
        const values = entry.values;
        return {
            id: entry.id,
            entryId: entry.entryId,
            version: entry.version,
            locked: entry.locked,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            savedBy: entry.savedBy,
            tenant: entry.tenant,
            pageEntryId: values.pageEntryId,
            baselineRevisionId: values.baselineRevisionId,
            status: (values.status as ExperimentStatus) || "draft",
            name: values.name || "",
            trafficSplit: values.trafficSplit ?? { control: 100, variants: {} },
            targeting: values.targeting ?? { trafficPercentage: 100 },
            goals: values.goals ?? {},
            analytics: values.analytics ?? { provider: "posthog" },
            startedOn: values.startedOn ?? null,
            stoppedOn: values.stoppedOn ?? null,
            winningVariantId: values.winningVariantId ?? null
        };
    }
}

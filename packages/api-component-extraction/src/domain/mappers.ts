import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type {
    Correction,
    CorrectionKind,
    CorrectionLogEntry,
    GateConfig,
    Job,
    ModelCall,
    Override,
    Run,
    RunCounts,
    StageLedgerEntry
} from "./types.js";
import type { Stage } from "~/constants.js";
import { DEFAULT_PAGE_CAP } from "~/constants.js";
import { initLedger } from "./ledger.js";

/** Maps CMS entries onto the domain types. Defensive on optional/legacy fields, like the theme mapper. */

const emptyCounts = (): RunCounts => ({ pages: 0, sections: 0, clusters: 0, components: 0 });

export class EntryToJobMapper {
    static toJob(entry: CmsEntry): Job {
        const gateConfig: GateConfig = entry.values.gateConfig ?? { stopAfter: [] };
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            tenant: entry.tenant,
            name: entry.values.name ?? "",
            siteUrl: entry.values.siteUrl ?? "",
            themeEntryId: entry.values.themeEntryId ?? "",
            themeVersion: entry.values.themeVersion ?? 0,
            pageCap: entry.values.pageCap ?? DEFAULT_PAGE_CAP,
            gateConfig,
            pinned: entry.values.pinned ?? false,
            note: entry.values.note ?? ""
        };
    }
}

export class EntryToRunMapper {
    static toRun(entry: CmsEntry): Run {
        const stages: StageLedgerEntry[] = Array.isArray(entry.values.stages)
            ? entry.values.stages
            : initLedger();
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            createdBy: entry.createdBy,
            savedOn: entry.savedOn,
            tenant: entry.tenant,
            jobId: entry.values.jobId ?? "",
            runNumber: entry.values.runNumber ?? 0,
            status: entry.values.status ?? "pending",
            note: entry.values.note ?? "",
            pinned: entry.values.pinned ?? false,
            counts: entry.values.counts ?? emptyCounts(),
            stages
        };
    }
}

export class EntryToModelCallMapper {
    static toModelCall(entry: CmsEntry): ModelCall {
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            tenant: entry.tenant,
            runId: entry.values.runId ?? "",
            stage: (entry.values.stage ?? "discover") as Stage,
            stageVersion: entry.values.stageVersion ?? 0,
            name: entry.values.name ?? "",
            modelId: entry.values.modelId ?? "",
            inputTokens: entry.values.inputTokens ?? 0,
            outputTokens: entry.values.outputTokens ?? 0,
            latencyMs: entry.values.latencyMs ?? 0,
            ok: entry.values.ok ?? false
        };
    }
}

export class EntryToOverrideMapper {
    static toOverride(entry: CmsEntry): Override {
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            tenant: entry.tenant,
            jobId: entry.values.jobId ?? "",
            stage: entry.values.stage,
            structuralSignature: entry.values.structuralSignature ?? "",
            correction: entry.values.correction as Correction,
            originRunId: entry.values.originRunId ?? ""
        };
    }
}

export class EntryToCorrectionMapper {
    static toCorrection(entry: CmsEntry): CorrectionLogEntry {
        return {
            id: entry.id,
            entryId: entry.entryId,
            createdOn: entry.createdOn,
            tenant: entry.tenant,
            runId: entry.values.runId ?? "",
            jobId: entry.values.jobId ?? "",
            stage: (entry.values.stage ?? "discover") as Stage,
            stageVersion: entry.values.stageVersion ?? 0,
            signature: entry.values.signature ?? "",
            kind: (entry.values.kind ?? "classify.set") as CorrectionKind,
            machineValue: entry.values.machineValue ?? null,
            humanValue: entry.values.humanValue ?? null
        };
    }
}

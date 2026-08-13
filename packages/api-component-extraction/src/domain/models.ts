import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { JOB_MODEL_ID, MODEL_CALL_MODEL_ID, RUN_MODEL_ID, OVERRIDE_MODEL_ID } from "~/constants.js";

/**
 * The three private CMS models — jobs, runs and overrides. Private (like `wbyTheme`) means invisible
 * to the CMS GraphQL endpoint and UI, so this feature's own schema is the only way in, while inheriting
 * revisions, tenant scoping and locking.
 *
 * Field split follows the Theme precedent: scalar/searchable fields for anything the list screens
 * filter or sort on (name, siteUrl, status, jobId), and plain `json` for the larger read-by-id blobs
 * (the gate config, the stage ledger, a correction payload).
 */

class JobModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({ modelId: JOB_MODEL_ID, name: "Component Extraction Job" });

        model.fields(fields => ({
            name: fields.text().label("Name"),
            siteUrl: fields.text().label("Site URL"),
            // Theme pin: resolved via `toRevisionId(entryId, version)`, the same path the theme preview
            // route uses.
            themeEntryId: fields.text().label("Theme entry id"),
            themeVersion: fields.number().label("Theme version"),
            pageCap: fields.number().label("Page cap"),
            gateConfig: fields.json().label("Gate configuration"),
            pinned: fields.boolean().label("Pinned"),
            note: fields.longText().label("Note")
        }));

        return [model];
    }
}

export const JobModelPlugin = ModelFactory.createImplementation({
    implementation: JobModelFactory,
    dependencies: []
});

class RunModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({ modelId: RUN_MODEL_ID, name: "Component Extraction Run" });

        model.fields(fields => ({
            // Filtered on to list a job's runs.
            jobId: fields.text().label("Job id"),
            runNumber: fields.number().label("Run number"),
            status: fields.text().label("Status"),
            note: fields.longText().label("Note"),
            pinned: fields.boolean().label("Pinned"),
            counts: fields.json().label("Counts"),
            // The nine-entry stage ledger — large, read by id.
            stages: fields.json().label("Stage ledger")
        }));

        return [model];
    }
}

export const RunModelPlugin = ModelFactory.createImplementation({
    implementation: RunModelFactory,
    dependencies: []
});

class OverrideModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: OVERRIDE_MODEL_ID,
            name: "Component Extraction Override"
        });

        model.fields(fields => ({
            // Overrides belong to the Job (not the Run), filtered by job and stage.
            jobId: fields.text().label("Job id"),
            stage: fields.text().label("Stage"),
            structuralSignature: fields.text().label("Structural signature"),
            correction: fields.json().label("Correction"),
            originRunId: fields.text().label("Origin run id")
        }));

        return [model];
    }
}

export const OverrideModelPlugin = ModelFactory.createImplementation({
    implementation: OverrideModelFactory,
    dependencies: []
});

class ModelCallModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: MODEL_CALL_MODEL_ID,
            name: "Component Extraction Model Call"
        });

        model.fields(fields => ({
            // Filtered on to list a run's calls, and a stage's calls at a given version.
            runId: fields.text().label("Run id"),
            stage: fields.text().label("Stage"),
            stageVersion: fields.number().label("Stage version"),
            name: fields.text().label("Call name"),
            modelId: fields.text().label("Model id"),
            inputTokens: fields.number().label("Input tokens"),
            outputTokens: fields.number().label("Output tokens"),
            latencyMs: fields.number().label("Latency (ms)"),
            ok: fields.boolean().label("Succeeded")
        }));

        return [model];
    }
}

export const ModelCallModelPlugin = ModelFactory.createImplementation({
    implementation: ModelCallModelFactory,
    dependencies: []
});

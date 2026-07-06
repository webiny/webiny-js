import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const EXPERIMENT_MODEL_ID = "wbyWbExperiment";

class ExperimentModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: EXPERIMENT_MODEL_ID,
            name: "Website Builder - Experiment"
        });

        model.fields(fields => ({
            // The page (CMS entryId) this experiment belongs to.
            pageEntryId: fields.text().label("Page entry ID"),
            // The immutable, explicit baseline revision (CMS revision id) this experiment is pinned to.
            baselineRevisionId: fields.text().label("Baseline revision ID"),
            // Experiment lifecycle status: draft | running | stopped | graduated.
            status: fields.text().label("Status"),
            name: fields.text().label("Name"),
            // Traffic split between the control bucket and each variant.
            trafficSplit: fields.json().label("Traffic split"),
            // Targeting rules: traffic percentage and optional geo / device.
            targeting: fields.json().label("Targeting"),
            // Conversion goals, opaque to Webiny and forwarded to the analytics provider.
            goals: fields.json().label("Goals"),
            // Provider-agnostic analytics configuration (e.g. provider id + experiment key).
            analytics: fields.json().label("Analytics"),
            startedOn: fields.datetime().label("Started on"),
            stoppedOn: fields.datetime().label("Stopped on"),
            // The variant graduated into a new revision when the experiment concluded.
            winningVariantId: fields.text().label("Winning variant ID")
        }));

        return [model];
    }
}

export const ExperimentModelPlugin = ModelFactory.createImplementation({
    implementation: ExperimentModelFactory,
    dependencies: []
});

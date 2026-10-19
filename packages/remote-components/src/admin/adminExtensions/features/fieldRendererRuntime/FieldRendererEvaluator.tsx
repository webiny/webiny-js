import React from "react";
import type { FieldRendererComponent } from "@webiny/app-admin/features/formModel/FormView.js";
import { FieldRendererEvaluator as Abstraction } from "./abstractions.js";
import { createFieldRendererRuntime } from "./createFieldRendererRuntime.js";
import { RendererErrorBoundary } from "./RendererErrorBoundary.js";
import { FIELD_RENDERER_GLOBAL_NAME } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import type { FieldRendererRuntime } from "~/shared/adminExtensions/fieldRendererRuntime.js";

type RendererFactory = (runtime: FieldRendererRuntime) => unknown;

function loadFactory(compiled: string): RendererFactory {
    // The API compiled this from stored source at write time; it runs with the signed-in session.
    const load = new Function(`${compiled}\nreturn ${FIELD_RENDERER_GLOBAL_NAME}.default;`);
    const factory: unknown = load();
    if (typeof factory !== "function") {
        throw new Error("The compiled renderer does not export a factory.");
    }
    return factory as RendererFactory;
}

class FieldRendererEvaluatorImpl implements Abstraction.Interface {
    private readonly runtime = createFieldRendererRuntime();

    evaluate(compiled: string, label: string): FieldRendererComponent {
        const factory = loadFactory(compiled);
        const Renderer = factory(this.runtime) as FieldRendererComponent | undefined;
        if (!Renderer) {
            throw new Error("The renderer source did not produce a component.");
        }

        const Bounded: FieldRendererComponent = props => (
            <RendererErrorBoundary label={label}>
                <Renderer {...props} />
            </RendererErrorBoundary>
        );
        Bounded.displayName = `AdminExtension(${label})`;
        return Bounded;
    }
}

export const FieldRendererEvaluator = Abstraction.createImplementation({
    implementation: FieldRendererEvaluatorImpl,
    dependencies: []
});

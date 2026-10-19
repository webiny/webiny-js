import { createAbstraction } from "@webiny/feature/admin";
import type { FieldRendererComponent } from "@webiny/app-admin/features/formModel/FormView.js";

export interface IFieldRendererEvaluator {
    /**
     * Runs compiled renderer code and returns its component, already wrapped so a render error stays
     * inside the field. Throws when the code does not produce a component.
     */
    evaluate(compiled: string, label: string): FieldRendererComponent;
}

export const FieldRendererEvaluator = createAbstraction<IFieldRendererEvaluator>(
    "RemoteComponents/FieldRendererEvaluator"
);

export namespace FieldRendererEvaluator {
    export type Interface = IFieldRendererEvaluator;
}

import React from "react";
import type { RenderResult } from "@testing-library/react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { FormModel } from "@webiny/app-admin";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { createStepFormOptions } from "./createStepFormOptions.js";

export interface StepFormFieldRendererProps {
    field: FormModel.FieldVM;
}

export interface RenderStepFormFieldParams {
    form: FormModel.Interface;
    name: string;
    Renderer: React.ComponentType<StepFormFieldRendererProps>;
    options?: StepFormOptions;
}

// Renders one field renderer of a real form inside the options context; re-renders on field changes.
export const renderStepFormField = (params: RenderStepFormFieldParams): RenderResult => {
    const { form, name, Renderer } = params;
    const options = params.options ?? createStepFormOptions();

    const Host = createReactiveComponent(function Host() {
        return (
            <StepFormOptionsContext.Provider value={options}>
                <Renderer field={form.field(name).vm} />
            </StepFormOptionsContext.Provider>
        );
    });

    return renderWithAdminUi(<Host />);
};

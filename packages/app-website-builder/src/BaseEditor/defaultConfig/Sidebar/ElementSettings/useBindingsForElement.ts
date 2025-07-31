import { toJS } from "mobx";
import { BindingsProcessor } from "@webiny/website-builder-sdk";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument";
import { useElementInputsAst } from "~/BaseEditor/hooks/useElementInputsAst";
import { InheritanceProcessor } from "@webiny/website-builder-sdk";

export const useBindingsForElement = (elementId: string) => {
    const { breakpoint, breakpoints } = useBreakpoint();
    const inputsAst = useElementInputsAst(elementId);

    return useSelectFromDocument(
        document => {
            const bindings = toJS(document.bindings[elementId]) ?? {};

            // Merge element bindings.
            const breakpointNames = breakpoints.map(bp => bp.name);
            const bindingsProcessor = new BindingsProcessor(breakpointNames);
            const inheritanceProcessor = new InheritanceProcessor(breakpointNames, inputsAst);

            return {
                rawBindings: bindings,
                resolvedBindings: bindingsProcessor.getBindings(bindings, breakpoint.name),
                inheritanceMap: inheritanceProcessor.getInheritanceMap(bindings, breakpoint.name)
            };
        },
        [elementId, breakpoint.name, breakpoints.length]
    );
};

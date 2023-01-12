import { PbBlockVariable, PbPageElement } from "~/graphql/types";

export function useElementVariables(
    block: PbPageElement,
    element: PbPageElement
): PbBlockVariable[] {
    if (element?.data?.variableId) {
        return block?.data?.variables?.filter(
            (variable: PbBlockVariable) => variable.id.split(".")[0] === element?.data?.variableId
        );
    }

    return [];
}

import {
    useSelectFromDocument,
    $getFirstElementOfType,
    useElementInputs
} from "webiny/admin/website-builder/page/editor";

export type FunnelInputs = {
    activeStep: number;
    registry: Record<string, any>;
    steps: Array<{ elementId: string; label: string; children: string[] }>;
};

export const useFunnel = () => {
    const elementId = useSelectFromDocument(state => {
        const funnel = $getFirstElementOfType(state, "FunnelBuilder/Funnel");
        return funnel ? funnel.id : null;
    });

    const { inputs, updateInputs } = useElementInputs<FunnelInputs>(elementId, 1);

    if (!elementId) {
        return null;
    }

    return { id: elementId, inputs, updateInputs };
};

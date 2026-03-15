import {
    useSelectFromEditor,
    useSelectFromDocument,
    $getFirstElementOfType,
    $getElementInputValues
} from "webiny/admin/website-builder/page/editor";

type Inputs = {
    activeStep: number;
    steps: Array<{ step: { label: string; children: string[] } }>;
};

export const useFunnel = () => {
    const components = useSelectFromEditor(editor => editor.components);

    const elementId = useSelectFromDocument(state => {
        const funnel = $getFirstElementOfType(state, "FunnelBuilder/Funnel");
        return funnel ? funnel.id : null;
    });

    const inputs = useSelectFromDocument(
        doc => $getElementInputValues(doc, components, elementId, 1) as Inputs,
        [elementId, components]
    );

    if (!elementId) {
        return null;
    }

    return { id: elementId, inputs };
};

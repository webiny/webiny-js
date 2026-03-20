import {
    useSelectFromDocument,
    $getFirstElementOfType,
    useElementInputs
} from "webiny/admin/website-builder/page/editor";
import { FunnelContainerInputs } from "./types";

export const useContainer = () => {
    const elementId = useSelectFromDocument(state => {
        const funnel = $getFirstElementOfType(state, "Fub/Container");
        return funnel ? funnel.id : null;
    });

    const { inputs, updateInputs } = useElementInputs<FunnelContainerInputs>(elementId, 1);
    return { id: elementId!, inputs, updateInputs };
};

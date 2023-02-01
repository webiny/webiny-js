import React, { Dispatch, SetStateAction } from "react";
import { CmsModel } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";

interface Props {
    model: CmsModel;
    setEntries: Dispatch<SetStateAction<CmsReferenceContentEntry[]>>;

    setLoading: Dispatch<SetStateAction<boolean>>;
}
export const Search: React.FC<Props> = ({ model }) => {
    return <>{model.modelId}</>;
};

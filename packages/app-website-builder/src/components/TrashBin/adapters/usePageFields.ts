import { useContainer } from "@webiny/app";
import { GetPageGraphQLFieldSelection } from "~/features/pages/getPage/abstractions.js";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";

export const usePageFields = () => {
    const container = useContainer();

    const resolvedFieldSelection = container.resolveAll(GetPageGraphQLFieldSelection);

    const resolvedFields = ["properties", "metadata", "bindings", "elements", "extensions"];
    for (const selection of resolvedFieldSelection) {
        resolvedFields.push(...selection.getSelection());
    }

    return useGetPageGraphQLFields(resolvedFields);
};

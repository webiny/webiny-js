import { useModel, useModelField } from "~/admin/hooks";

export const useModelFieldGraphqlContext = () => {
    const { model } = useModel();
    const { field } = useModelField();

    return {
        cms: {
            model,
            field
        }
    };
};

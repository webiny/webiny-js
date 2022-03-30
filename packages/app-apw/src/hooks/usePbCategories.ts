import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { LIST_CATEGORIES } from "~/graphql/workflow.gql";
import { PbCategory } from "~/types";

interface UsePbCategoriesResult {
    categories: PbCategory[];
    loading: boolean;
}

export const usePbCategories = (): UsePbCategoriesResult => {
    const { data, loading } = useQuery(LIST_CATEGORIES);

    return {
        categories: get(data, "pageBuilder.listCategories.data", []),
        loading
    };
};

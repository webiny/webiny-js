import { useApolloClient } from "@apollo/react-hooks";
import { DUPLICATE_PAGE } from "~/admin/graphql/pages";
import { DuplicatePageResponse, DuplicatePageVariables, isPbPageData, PageItem } from "./types";

interface DuplicatePageMutationParams {
    page: PageItem;
}

export const useDuplicatePageCase = () => {
    const client = useApolloClient();

    const duplicatePage = async (params: DuplicatePageMutationParams) => {
        let location;

        if (isPbPageData(params.page)) {
            location = params.page.wbyAco_location;
        } else {
            location = params.page.location;
        }

        const { data: response } = await client.mutate<
            DuplicatePageResponse,
            DuplicatePageVariables
        >({
            mutation: DUPLICATE_PAGE,
            variables: {
                id: params.page.id,
                meta: { location }
            }
        });

        if (!response) {
            throw new Error(`Network error while duplicating page "${params.page.id}".`);
        }

        const { data, error } = response.pageBuilder.duplicatePage;

        if (!data) {
            throw new Error(error?.message || `Could not duplicate page "${params.page.id}".`);
        }

        return data;
    };

    return {
        duplicatePage
    };
};

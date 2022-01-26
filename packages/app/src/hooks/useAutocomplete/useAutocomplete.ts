import { useDataList } from "../useDataList";
import { debounce } from "lodash";
import { DocumentNode } from "graphql";

interface UseAutocompleteHook {
    options: any[];
    onInput(value: string): void;
}

interface Props {
    query: DocumentNode;
    search?: string | ((value: string) => string);
}

export const useAutocomplete = (props: Props): UseAutocompleteHook => {
    const dataList = useDataList({ useRouter: false, ...props });

    return {
        options: dataList.data || [],
        onInput: debounce(query => {
            if (!query) {
                return;
            }

            let search = props.search || query;
            if (typeof search === "function") {
                search = search(query);
            }

            dataList.setSearch(search);
        }, 250)
    };
};

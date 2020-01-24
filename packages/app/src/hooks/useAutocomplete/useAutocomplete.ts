import { useDataList } from "@webiny/app/hooks/useDataList";
import { debounce } from "lodash";

interface UseAutocompleteHook {
    options: any[];
    onInput(value: string): void;
}

export const useAutocomplete = (props): UseAutocompleteHook => {
    const useDataListProps = props.query ? props : { query: props };

    const dataList = useDataList({ useRouter: false, ...useDataListProps });

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

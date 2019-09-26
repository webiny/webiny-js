// @flow
import * as React from "react";
import { useDataList } from "@webiny/app/hooks/useDataList";
import { debounce } from "lodash";

export const useAutocomplete = (props: Object): Function => {
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

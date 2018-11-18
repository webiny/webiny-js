// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { withDataList } from "./withDataList";
import { debounce } from "lodash";

export const withAutoComplete = (withAutoCompleteProps: Object): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            withDataList(withAutoCompleteProps),
            withProps(props => {
                const { dataList, ...rest } = props;

                return {
                    ...rest,
                    options: dataList.data || [],
                    onInput: debounce(query => {
                        if (!query) {
                            return;
                        }

                        let search = withAutoCompleteProps.search || query;
                        if (typeof search === "function") {
                            search = search(query);
                        }

                        dataList.setSearch(search);
                    }, 250)
                };
            })
        )(BaseComponent);
    };
};

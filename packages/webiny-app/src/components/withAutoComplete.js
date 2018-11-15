// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { withDataList } from "./withDataList";
import { debounce } from "lodash";

export const withAutoComplete = (props: Object): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            withDataList(props),
            withProps(props => {
                const { dataList, ...rest } = props;

                return {
                    ...rest,
                    options: dataList.data || [],
                    onInput: debounce(query => {
                        console.log(query);
                        query && dataList.setSearch(query);
                    }, 250)
                };
            })
        )(BaseComponent);
    };
};

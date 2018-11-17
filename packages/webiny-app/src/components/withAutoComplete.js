// @flow
import * as React from "react";
import { compose, withProps } from "recompose";
import { withDataList } from "./withDataList";
import { debounce } from "lodash";
import invariant from "invariant";

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

                        let { variables } = withAutoCompleteProps;
                        invariant(
                            variables,
                            `"variables" prop for withAutoComplete component is missing.`
                        );

                        if (typeof variables === "function") {
                            variables = variables(query);
                        }

                        dataList.setSearch(variables);
                    }, 250)
                };
            })
        )(BaseComponent);
    };
};

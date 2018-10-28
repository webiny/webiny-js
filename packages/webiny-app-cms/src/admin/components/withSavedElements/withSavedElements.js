// @flow
import { graphql } from "react-apollo";
import { get } from "dot-prop-immutable";
import { listElements } from "webiny-app-cms/admin/graphql/pages";
import createElementPlugin from "./createElementPlugin";
import createBlockPlugin from "./createBlockPlugin";

export const withSavedElements = () =>
    graphql(listElements, {
        props: ({ data }) => {
            if (data.loading) {
                return { elements: null };
            }

            const elements = get(data, "cms.elements.data");
            elements.forEach(el => {
                if (el.type === "element") {
                    createElementPlugin(el);
                } else {
                    createBlockPlugin(el);
                }
            });

            return { elements };
        }
    });

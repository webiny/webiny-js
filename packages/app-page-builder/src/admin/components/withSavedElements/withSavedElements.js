// @flow
import { graphql } from "react-apollo";
import { get } from "dot-prop-immutable";
import { listElements } from "@webiny/app-page-builder/admin/graphql/pages";
import createElementPlugin from "./createElementPlugin";
import createBlockPlugin from "./createBlockPlugin";

let elementsAdded = false;

export const withSavedElements = () =>
    graphql(listElements, {
        props: ({ data }) => {
            if (data.loading) {
                return { elements: null };
            }

            const elements = get(data, "pageBuilder.elements.data");
            if (!elementsAdded) {
                elements.forEach(el => {
                    if (el.type === "element") {
                        createElementPlugin(el);
                    } else {
                        createBlockPlugin(el);
                    }
                });
                elementsAdded = true;
            }

            return { elements };
        }
    });

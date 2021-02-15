import * as React from "react";
import { Query } from "@apollo/react-components";
import gql from "graphql-tag";
import get from "lodash.get";
import invariant from "invariant";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "ps-tag": {
                key?: string;
                value?: string;
            };
        }
    }
}

export const GET_PUBLIC_MENU = gql`
    query GetPublicMenu($slug: String!) {
        pageBuilder {
            getPublicMenu(slug: $slug) {
                data {
                    slug
                    title
                    items
                }
                error {
                    code
                }
            }
        }
    }
`;

const Menu = ({ slug, component: Component }) => {
    invariant(Component, `You must provide a valid Menu component name (via "component" prop).`);

    return (
        <Query query={GET_PUBLIC_MENU} variables={{ slug }}>
            {props => {
                const data = get(props, "data.pageBuilder.getPublicMenu.data", {
                    items: [],
                    title: null,
                    slug: null
                });

                return (
                    <>
                        <ps-tag data-key="pb-menu" data-value={slug} />
                        <Component {...props} data={data} />
                    </>
                );
            }}
        </Query>
    );
};

export default Menu;

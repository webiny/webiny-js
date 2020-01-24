import * as React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import invariant from "invariant";

export const getMenuBySlug = gql`
    query GetMenuBySlug($slug: String!) {
        pageBuilder {
            menus: getMenuBySlug(slug: $slug) {
                data {
                    slug
                    title
                    items
                }
            }
        }
    }
`;

const Menu = ({ slug, component: Component }) => {
    invariant(Component, `You must provide a valid Menu component name (via "component" prop).`);

    return (
        <Query query={getMenuBySlug} variables={{ slug }}>
            {props => {
                const data = get(props, "data.pageBuilder.menus.data", {
                    items: [],
                    title: null,
                    slug: null
                });

                return (
                    <>
                        <ssr-cache data-class="pb-menu" data-id={slug} />
                        <Component {...props} data={data} />
                    </>
                );
            }}
        </Query>
    );
};

export default Menu;

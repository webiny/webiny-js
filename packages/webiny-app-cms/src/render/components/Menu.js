//@flow
import * as React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";

export const getMenuBySlug = gql`
    query GetMenuBySlug($slug: String!) {
        cms {
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

type RenderPropParams = * & {
    data: {
        items: Array<Object>,
        title: ?string,
        slug: ?string
    }
};

const Menu = ({ slug, children }: { slug: string, children: RenderPropParams => React.Node }) => (
    <Query query={getMenuBySlug} variables={{ slug }}>
        {props =>
            children({
                ...props,
                data: get(props, "data.cms.menus.data", { items: [], title: null, slug: null })
            })
        }
    </Query>
);

export default Menu;

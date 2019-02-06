//@flow
import * as React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { withCms, type WithCmsPropsType } from "webiny-app-cms/context";
import invariant from "invariant";

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

type Props = { cms: WithCmsPropsType } & { slug: string, component: string };

const Menu = ({ slug, component: Component }: Props) => {
    invariant(Component, `You must provide a valid Menu component name (via "component" prop).`);

    return (
        <Query query={getMenuBySlug} variables={{ slug }}>
            {props => {
                const data = get(props, "data.cms.menus.data", {
                    items: [],
                    title: null,
                    slug: null
                });

                return <Component {...props} data={data} />;
            }}
        </Query>
    );
};

export default withCms()(Menu);

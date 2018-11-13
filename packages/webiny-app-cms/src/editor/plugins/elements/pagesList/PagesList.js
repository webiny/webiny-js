// @flow
import * as React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";

const loadPages = gql`
    query ListPages($perPage: Int) {
        cms {
            listPages(perPage: $perPage) {
                data {
                    id
                    title
                    slug
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        name
                    }
                }
            }
        }
    }
`;

const PagesList = ({ element, theme } = {}) => {
    if (!element || !element.settings) {
        return "Not configured!";
    }
    
    console.log(element);

    const { limit, component } = element.settings;
    const { component: ListComponent } = theme.elements.pagesList.components.find(
        cmp => cmp.name === component
    );

    if (!ListComponent) {
        return "You must select a component to render your list!";
    }

    return (
        <Query query={loadPages} variables={{ perPage: limit }}>
            {({ data, loading }) => {
                if (loading) {
                    return "Loading...";
                }

                return <ListComponent {...data.cms.listPages} theme={theme} />;
            }}
        </Query>
    );
};

export default PagesList;

// @flow
import * as React from "react";
import gql from "graphql-tag";
import { pure } from "recompose";
import { Query } from "react-apollo";

const loadPages = gql`
    query ListPages($perPage: Int) {
        cms {
            listPages(perPage: $perPage) {
                data {
                    id
                    title
                    url
                    createdBy {
                        firstName
                        lastName
                    }
                    category {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const PagesList = pure(({ element, theme }: Object = {}) => {
    const { limit, component } = element.settings;
    const pageList = theme.elements.pagesList.components.find(cmp => cmp.name === component);

    if (!pageList) {
        return "Selected page list component not found!";
    }

    const { component: ListComponent } = pageList;

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
});

export default PagesList;

// @flow
import * as React from "react";
import { pure } from "recompose";
import { Query } from "react-apollo";
import { loadPages } from "./graphql";

const PagesList = pure(({ settings, theme }: Object = {}) => {
    const { limit, component } = settings;
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

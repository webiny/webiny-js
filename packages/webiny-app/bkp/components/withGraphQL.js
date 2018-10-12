// @flow
import * as React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { graphqlMutation, graphqlQuery } from "./../actions";

const query = params => graphqlQuery(params);
const mutation = params => graphqlMutation(params);

export default () => {
    return (BaseComponent: typeof React.Component) => {
        const Component = connect(
            null,
            dispatch => ({ graphql: bindActionCreators({ query, mutation }, dispatch) })
        )(BaseComponent);

        Component.displayName = "withGraphQL";
        return Component;
    };
};

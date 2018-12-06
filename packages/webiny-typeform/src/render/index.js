// @flow
import * as React from "react";
import { Query } from "react-apollo";
import query from "./graphql";

class TypeForm extends React.Component<*> {
    componentDidMount() {
        const { settings } = this.props;
        if (settings.enabled !== true) {
            return;
        }
    }

    render() {
        return null;
    }
}

export default [
    {
        type: "module-render",
        name: "module-render-typeform",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    if (loading) {
                        return null;
                    }

                    return <TypeForm settings={data.settings.typeform} />;
                }}
            </Query>
        )
    }
];

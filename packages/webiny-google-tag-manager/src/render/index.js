// @flow
import * as React from "react";
import { Query } from "react-apollo";
import query from "./graphql";

class GoogleTagManager extends React.Component<*> {
    componentDidMount() {
        const { settings } = this.props;
        if (settings.enabled !== true) {
            return;
        }

        // Insert necessary things.
    }

    render() {
        return null;
    }
}

export default [
    {
        type: "module-render",
        name: "module-render-google-tag-manager",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    if (loading) {
                        return null;
                    }

                    return <GoogleTagManager settings={data.settings.googleTagManager} />;
                }}
            </Query>
        )
    }
];

// @flow
import * as React from "react";
import { Query } from "react-apollo";
import query from "./graphql";
import showCookiePolicy from "./../utils/showCookiePolicy";

class CookiePolicy extends React.Component<*> {
    componentDidMount() {
        const { settings } = this.props;
        if (settings && settings.enabled !== true) {
            return;
        }

        showCookiePolicy(settings);
    }

    render() {
        return null;
    }
}

export default [
    {
        type: "addon-render",
        name: "addon-render-cookie-policy",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    if (loading) {
                        return null;
                    }

                    return <CookiePolicy settings={data.settings.cookiePolicy} />;
                }}
            </Query>
        )
    }
];

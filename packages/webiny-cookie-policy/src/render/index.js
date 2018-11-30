// @flow
import * as React from "react";
import { Query } from "react-apollo";
import query from "./graphql";
import load from "webiny-load-assets";

class CookiePolicy extends React.Component {
    componentDidMount() {
        load(
            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css",
            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"
        ).then(() => {
            window.cookieconsent.initialise({
                palette: {
                    popup: {
                        background: "#000"
                    },
                    button: {
                        background: "#f1d600"
                    }
                }
            });
        });
    }

    render() {
        return null;
    }
}

export default [
    {
        type: "module-render",
        name: "module-render-cookie-policy",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    if (loading) {
                        return null;
                    }

                    return <CookiePolicy data={data.settings.cookiePolicy.data} />;
                }}
            </Query>
        )
    }
];

// @flow
import * as React from "react";
import { Query } from "react-apollo";
import query from "./graphql";
import load from "webiny-load-assets";

class Mailchimp extends React.Component<*> {
    componentDidMount() {
        const { settings } = this.props;
        if (settings.enabled !== true) {
            return;
        }

        load(
            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css",
            "//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"
        ).then(() => window.cookieconsent.initialise(settings));
    }

    render() {
        return null;
    }
}

export default [
    {
        type: "module-render",
        name: "module-render-mailchimp",
        component: (
            <Query query={query}>
                {({ data, loading }) => {
                    if (loading) {
                        return null;
                    }

                    return <Mailchimp settings={data.settings.mailchimp} />;
                }}
            </Query>
        )
    }
];

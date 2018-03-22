import React from "react";
import { i18n, createComponent } from "webiny-client";

/**
 * @i18n.namespace Webiny.Skeleton.Layout.Dashboard
 */
class Dashboard extends React.Component {
    render() {
        const { View } = this.props;
        return (
            <View.Dashboard>
                <View.Header
                    title={i18n("Welcome to Webiny!")}
                    description={i18n(
                        "This is a demo dashboard! From here you can start developing your almighty app."
                    )}
                />
            </View.Dashboard>
        );
    }
}

export default createComponent(Dashboard);

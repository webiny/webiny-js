import React from "react";
import { i18n, createComponent } from "webiny-client";

const t = i18n.namespace("Webiny.Skeleton.Layout.Dashboard");
class Dashboard extends React.Component {
    render() {
        const { View } = this.props;
        return (
            <View.Dashboard>
                <View.Header
                    title={t`Welcome to Webiny!`}
                    description={t`This is a demo dashboard! From here you can start developing your almighty app.`}
                />
            </View.Dashboard>
        );
    }
}

export default createComponent(Dashboard);

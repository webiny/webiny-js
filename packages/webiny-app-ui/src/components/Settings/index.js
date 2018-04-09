import React from "react";
import { app, createComponent, i18n } from "webiny-app";

const t = i18n.namespace("Webiny.Ui.Settings");
class Settings extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const growler = app.services.get("growler");

        const { Form } = this.props.modules;
        const formProps = {
            api: this.props.api,
            createHttpMethod: "patch",
            onSuccessMessage: this.props.onSuccessMessage,
            onSubmitSuccess: this.props.onSubmitSuccess,
            children: this.props.children,
            loadModel({ form }) {
                form.showLoading();
                return form.props.api.get("/").then(response => {
                    form.hideLoading();
                    if (response.data.code) {
                        growler.danger(
                            response.data.message,
                            t`That didn't go as expected...`,
                            true
                        );
                        return form.handleApiError(response);
                    }
                    return response.data.data;
                });
            }
        };

        return <Form {...formProps} />;
    }
}

Settings.defaultProps = {
    api: "/settings",
    onSuccessMessage: () => t`Settings saved!`,
    onSubmitSuccess: null
};

export default createComponent(Settings, { modules: ["Form"] });

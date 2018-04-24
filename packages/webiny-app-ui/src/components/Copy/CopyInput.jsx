import React from "react";
import _ from "lodash";
import { app, i18n, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css?prefix=CopyInput";

const t = i18n.namespace("Webiny.Ui.Copy.CopyInput");
class CopyInput extends React.Component {
    constructor() {
        super();
        this.button = null;
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            if (this.button) {
                clearInterval(this.interval);
                this.interval = null;
                this.setup();
            }
        }, 100);
    }

    componentWillUnmount() {
        this.clipboard.destroy();
    }

    setup() {
        this.clipboard = new this.props.modules.Clipboard(this.button, {
            text: () => {
                return this.props.value;
            }
        });

        this.clipboard.on("success", () => {
            const onSuccessMessage = this.props.onSuccessMessage;
            if (_.isFunction(onSuccessMessage)) {
                onSuccessMessage();
            } else if (_.isString(onSuccessMessage)) {
                app.services.get("growler").info(onSuccessMessage);
            }
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { modules: { Button, FormGroup }, styles } = this.props;

        const props = {
            readOnly: true,
            type: "text",
            className: styles.input,
            value: this.props.value || ""
        };

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                {this.props.renderInfo.call(this)}
                <div className="inputGroup">
                    <input {...props} />
                    <Button
                        onRef={ref => (this.button = ref)}
                        type="primary"
                        className={styles.btnCopy}
                    >
                        {this.props.actionLabel}
                    </Button>
                </div>
                {this.props.renderDescription.call(this)}
            </FormGroup>
        );
    }
}

CopyInput.defaultProps = {
    actionLabel: t`Copy`,
    onSuccessMessage: t`Copied to clipboard!`,
    onCopy: _.noop
};

export default createComponent([CopyInput, FormComponent], {
    styles,
    modules: ["Button", "FormGroup", { Clipboard: () => import("clipboard") }]
});

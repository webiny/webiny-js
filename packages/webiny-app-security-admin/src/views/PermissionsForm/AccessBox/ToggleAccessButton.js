import React from "react";
import _ from "lodash";
import classNames from "classnames";
import styles from "./styles.css";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.ToggleAccessButton");

class ToggleAccessButton extends React.Component {
    renderLabel() {
        if (this.props.label) {
            return this.props.label;
        }

        return "E";
    }

    render() {
        const { Button, method, onClick, exposed } = this.props;
        return (
            <div className={styles.toggleAccessButtonWrapper} ref={ref => (this.ref = ref)}>
                {method.public ? (
                    <Button
                        type="primary"
                        className={classNames(
                            styles.toggleAccessButton,
                            styles.toggleAccessButtonPublic
                        )}
                    >
                        {t`P`}
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        onClick={() => {
                            this.ref.querySelector("button").blur();
                            onClick();
                        }}
                        className={classNames(styles.toggleAccessButton, {
                            [styles.toggleAccessButtonExposed]: exposed
                        })}
                    >
                        {this.renderLabel()}
                    </Button>
                )}
            </div>
        );
    }
}

ToggleAccessButton.defaultProps = {
    label: null,
    method: null,
    value: false,
    onClick: _.noop
};

export default createComponent(ToggleAccessButton, {
    modules: ["Button"]
});

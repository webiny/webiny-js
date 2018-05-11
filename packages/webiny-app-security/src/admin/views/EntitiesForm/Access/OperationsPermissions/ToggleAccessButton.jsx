import React from "react";
import styles from "./ToggleAccessButton.scss";
import { createComponent } from "webiny-app";
import _ from "lodash";
import classNames from "classnames";

class ToggleAccessButton extends React.Component {
    constructor() {
        super();
        this.ref = null;
    }

    render() {
        const {
            modules: { Button },
            onClick,
            value
        } = this.props;
        return (
            <div className={styles.toggleAccessButtonWrapper} ref={ref => (this.ref = ref)}>
                <Button
                    type="primary"
                    onClick={() => {
                        this.ref.querySelector("button").blur();
                        onClick();
                    }}
                    className={classNames(styles.toggleAccessButton, {
                        [styles.toggleAccessButtonExposed]: value
                    })}
                >
                    {this.props.label}
                </Button>
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

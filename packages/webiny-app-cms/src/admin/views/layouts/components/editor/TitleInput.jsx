import React from "react";
import classSet from "classnames";
import _ from "lodash";
import { createComponent } from "webiny-app";
import styles from "./TitleInput.scss";

class TitleInput extends React.Component {
    constructor() {
        super();
        this.state = {
            focused: false
        };
    }

    shouldComponentUpdate(props, state) {
        return !_.isEqual(props.value, this.props.value) || !_.isEqual(state, this.state);
    }

    render() {
        const { DelayedOnChange } = this.props.modules;
        return (
            <div className={styles.mainInput}>
                <DelayedOnChange value={this.props.value} onChange={this.props.onChange}>
                    {doc => (
                        <input
                            className={classSet(styles.inputMaterial, {
                                [styles.focused]: this.state.focused || this.props.value
                            })}
                            type="text"
                            {...doc}
                            onClick={() => this.setState({ focused: true })}
                            onBlur={() => this.setState({ focused: false })}
                        />
                    )}
                </DelayedOnChange>
                <span className={styles.bar} />
                <label className={styles.dynamicLabel}>LAYOUT TITLE</label>
            </div>
        );
    }
}

export default createComponent(TitleInput, { modules: ["DelayedOnChange"] });

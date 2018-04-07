import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import styles from "./TitleInput.scss";

class TitleInput extends React.Component {
    constructor() {
        super();
        this.state = {
            focused: false
        };
    }

    render() {
        return (
            <div className={styles.mainInput}>
                <input
                    className={classSet(styles.inputMaterial, {
                        [styles.focused]: this.state.focused || this.props.value
                    })}
                    type="text"
                    value={this.props.value}
                    onChange={e => this.props.onChange(e.target.value)}
                    onClick={() => this.setState({ focused: true })}
                    onBlur={() => this.setState({ focused: false })}
                />
                <span className={styles.bar} />
                <label className={styles.dynamicLabel}>PAGE TITLE</label>
            </div>
        );
    }
}

export default createComponent(TitleInput, { modules: [] });

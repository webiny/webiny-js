import React from 'react';
import classSet from "classnames";
import { createComponent } from 'webiny-app';
import styles from './styles.css';

class TabContent extends React.Component {
    render() {
        if (!this.props.disabled && (this.props.active || this.props.alwaysRender)) {
            const tabClass = classSet(
                styles.pane,
                {
                    [styles.paneActive]: this.props.active
                }
            );
            return (
                <div className={tabClass}>
                    {this.props.children}
                    <div className={this.props.styles.clearfix}/>
                </div>
            );
        }

        return null;
    }
}

TabContent.defaultProps = {
    alwaysRender: true,
    active: false, // "private" prop passed by Tabs component
    disabled: false // "private" prop passed by Tabs component
};

export default createComponent(TabContent, { styles });
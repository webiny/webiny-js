import React from 'react';
import { createComponent } from 'webiny-app';
import classSet from "classnames";
import styles from './styles.css?prefix=wui-view';


class InfoBlock extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        let showHeader = false;
        if (this.props.title !== '' || this.props.description !== '') {
            showHeader = true;
        }

        return (
            <div className={classSet(styles.infoBlock, this.props.className)}>
                {showHeader && (
                    <div className={styles.header}>
                        <h4 className={styles.title}>{this.props.title}</h4>
                        <div className={styles.titleLight}>{this.props.description}</div>
                    </div>
                )}
                <div className={styles.container}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

InfoBlock.defaultProps = {
    title: '',
    description: '',
    className: ''
};

export default createComponent(InfoBlock, { styles });
import React from 'react';
import classSet from 'classnames';
import { inject } from 'webiny-app';
import styles from "./styles.module.css";

@inject({ styles })
class ChartBlock extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { styles } = this.props;

        return (
            <div className={classSet(styles.infoBlock, this.props.className)}>
                <div className={styles.header}>
                    <h4 className={styles.title}>{this.props.title}</h4>
                    <div className={styles.titleLight}>{this.props.description}</div>
                </div>
                <div className={styles.container}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

ChartBlock.defaultProps = {
    title: '',
    description: '',
    className: ''
};

export default ChartBlock;
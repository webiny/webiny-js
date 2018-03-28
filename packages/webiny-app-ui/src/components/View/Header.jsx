import React from 'react';
import { createComponent } from 'webiny-app';
import styles from './styles.css';

class Header extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { styles } = this.props;

        return (
            <div className={styles.viewHeader}>
                <div className={styles.titleWrapper}>
                    <h2 className={styles.titleContent}>
                        {this.props.title}
                    </h2>

                    <div className={styles.titleDescription}>{this.props.description}</div>
                </div>
                <div className={styles.titleRight}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

Header.defaultProps = {
    title: null,
    description: null
};

export default createComponent(Header, { styles });
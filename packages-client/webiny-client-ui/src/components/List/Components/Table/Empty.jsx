import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';
import styles from '../../styles.css';

const t = i18n.namespace("Webiny.Ui.List.Table.Empty");
class Empty extends React.Component {
    render() {
        const { render, children, message } = this.props;
        if (render) {
            return render.call(this);
        }

        if (children) {
            return <webiny-list-empty>{_.isFunction(children) ? children() : children}</webiny-list-empty>;
        }

        return (
            <webiny-list-empty>{message}</webiny-list-empty>
        );
    }
}

Empty.defaultProps = {
    message: (
        <div className={styles.emptyContainer}>
            <div className={styles.content}>
                <h2>{t`Sorry, but no records matched your query.`}</h2>

                <p>{t`Try changing your search parameters.`}</p>
            </div>
        </div>
    )
};

export default createComponent(Empty, { styles });
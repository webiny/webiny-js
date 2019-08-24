import React from 'react';
import _ from 'lodash';
import { inject, i18n } from 'webiny-app';

const t = i18n.namespace("Webiny.Ui.ExpandableList.Empty");
@inject()
class Empty extends React.Component {
    render() {
        const { children, render, message } = this.props;

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
        <div className="porlet">
            <div className="porlet-body text-center">
                <h2>{t`Sorry, but no records matched your query.`}</h2>

                <p>{t`Try changing your search parameters.`}</p>
            </div>
        </div>
    )
};

export default Empty;
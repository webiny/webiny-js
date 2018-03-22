import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.ExpandableList.Empty
 */
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
                <h2>{i18n('Sorry, but no records matched your query.')}</h2>

                <p>{i18n('Try changing your search parameters.')}</p>
            </div>
        </div>
    )
};

export default createComponent(Empty);
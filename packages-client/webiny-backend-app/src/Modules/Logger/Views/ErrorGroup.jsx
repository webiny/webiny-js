import React from 'react';
import {Webiny} from 'webiny-client';
import ErrorDetailsJs from './ErrorDetailsJs';
import ErrorDetailsApi from './ErrorDetailsApi';
import ErrorDetailsPhp from './ErrorDetailsPhp';

/**
 * @i18n.namespace Webiny.Backend.Logger.ErrorGroup
 */
class ErrorGroup extends Webiny.Ui.View {

}

ErrorGroup.defaultProps = {
    renderer() {
        const statProps = {
            api: '/entities/webiny/logger-entry',
            query: {errorGroup: this.props.errorGroup.id, '_sort': '-createdOn'},
            fields: '*',
            layout: null
        };

        const ErrorDetails = {
            js: ErrorDetailsJs,
            php: ErrorDetailsPhp,
            api: ErrorDetailsApi
        };

        return (
            <Webiny.Ui.LazyLoad modules={['List', 'ExpandableList', 'Filters']}>
                {(Ui) => (
                    <Ui.List {...statProps}>
                        {({list, meta}) => (
                            <Ui.ExpandableList>
                                {list.map(row => {
                                    return (
                                        <Ui.ExpandableList.Row key={row.id}>
                                            <Ui.ExpandableList.Field width={6}>
                                                {row.url}
                                            </Ui.ExpandableList.Field>
                                            <Ui.ExpandableList.Field width={4}>
                                                <Ui.Filters.DateTime value={row.date}/>
                                            </Ui.ExpandableList.Field>

                                            <Ui.ExpandableList.RowDetailsContent title={row.url}>
                                                {React.createElement(ErrorDetails[this.props.errorGroup.type], {errorEntry: row})}
                                            </Ui.ExpandableList.RowDetailsContent>

                                            <Ui.ExpandableList.ActionSet>
                                                <Ui.ExpandableList.Action
                                                    label={this.i18n('Resolve Item')}
                                                    icon="icon-check"
                                                    onClick={() => this.props.resolveError(row, list, this.props.parentList)}/>
                                            </Ui.ExpandableList.ActionSet>

                                        </Ui.ExpandableList.Row>
                                    );
                                })}
                            </Ui.ExpandableList>
                        )}
                    </Ui.List>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
};

export default ErrorGroup;
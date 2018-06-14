import React from 'react';
import _ from 'lodash';
import { Component, isElementOfType } from 'webiny-client';
import Empty from './Empty';
import Row from './Row';
import Field from './Field';
import ActionSet from './ActionSet';
import './styles.scss';

@Component()
class ExpandableList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            zIndex: 1000
        };

        this.renderHeader = this.renderHeader.bind(this);
    }

    renderHeader(header, i) {
        let className = '';

        if (_.get(header, 'className', false)) {
            className = header.className;
        }

        return (
            <div className={className + ' expandable-list__header__field flex-cell flex-width-' + header.width} key={i}>
                {header.name}
            </div>
        );
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (!this.props.data || !this.props.data.length && this.props.showEmpty) {
            return <Empty/>;
        }

        // get row and extract the header info
        let headers = [];
        let actionSet = false;
        _.forEach(this.props.children, row => {
            if (isElementOfType(row, Row)) {
                if (React.isValidElement(row)) {
                    _.forEach(row.props.children, val => {
                        if (isElementOfType(val, ActionSet)) {
                            actionSet = true;
                        }

                        if (isElementOfType(val, Field) && _.get(val.props, 'name', false)) {
                            headers.push(_.omit(val.props, ['children', 'renderer']));
                        }
                    });

                    if (headers.length > 0) {
                        if (actionSet) {
                            headers.push({ key: 99, width: 2 });
                        }
                        headers =
                            <div className="expandable-list__header flex-row">{headers.map(this.renderHeader)}</div>;
                        return false; // exit foreach
                    }
                }
            }
        });

        // get rows
        const rows = [];
        _.forEach(this.props.children, row => {
            if (isElementOfType(row, Row)) {
                rows.push(row);
            } else if (_.isArray(row)) {
                _.forEach(row, rowDetails => {
                    if (isElementOfType(rowDetails, Row)) {
                        rows.push(rowDetails);
                    }
                });
                return false;
            }
        });

        return (
            <div className="expandable-list">
                {headers}
                <div className="expandable-list__content">
                    {rows}
                </div>
            </div>
        );
    }
}


ExpandableList.defaultProps = {
    data: [],
    type: 'simple'
};

export default ExpandableList;
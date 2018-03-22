import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import SelectRowField from './Fields/SelectRowField';
import Row from './Row';
import Field from './Field';
import FieldInfo from './FieldInfo';
import Actions from './Actions';
import Footer from './Footer';
import RowDetails from './RowDetails';
import Header from './Header';
import Empty from './Empty';
import styles from '../../styles.css';

class Table extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.rowElement = null;
        this.selectAllRowsElement = null;
        this.rowDetailsElement = null;
        this.footerElement = null;
        this.emptyElement = null;
        this.headers = [];
        this.rows = {};

        this.state = {
            selectAll: false,
            selectedRows: props.selectedRows,
            expandedRows: []
        };

        this.bindMethods(
            'attachToTable',
            'prepareChildren',
            'prepareChild',
            'renderRow',
            'renderHeader',
            'onSort',
            'onSelect',
            'selectAll',
            'showRowDetails',
            'hideRowDetails',
            'toggleRowDetails'
        );
    }

    componentWillMount() {
        super.componentWillMount();
        this.tempProps = this.props; // assign props to tempProps to be accessible without passing through method args
        this.prepareChildren(this.props.children);
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setState({selectedRows: props.selectedRows});
        this.tempProps = props; // assign props to tempProps to be accessible without passing through method args
        this.prepareChildren(props.children);
    }

    attachToTable(row, index) {
        this.rows[index] = row;
    }

    selectAll(selected) {
        let data = [];
        if (selected) {
            Object.values(this.rows).map(row => {
                if (!row.isDisabled()) {
                    data.push(row.props.data);
                }
            });
        }

        this.setState({
            selectAll: selected,
            selectedRows: data
        }, () => {
            if (this.props.onSelect) {
                this.props.onSelect(this.state.selectedRows);
            }
        });
    }

    onSelect(data, selected) {
        const selectedRows = this.state.selectedRows;
        if (selected) {
            selectedRows.push(data);
        } else {
            selectedRows.splice(_.findIndex(selectedRows, data), 1);
        }
        this.setState({selectedRows});
        this.props.onSelect(selectedRows);
    }

    onSort(name, sort) {
        this.selectAll(false);
        this.setState({expandedRows: []});
        const sorters = _.clone(this.props.sorters);
        if (sort !== 0) {
            sorters[name] = sort;
        } else {
            delete sorters[name];
        }

        this.props.onSort(sorters);
    }

    prepareChild(child) {
        if (typeof child !== 'object' || child === null) {
            return child;
        }

        // Table handles Row and Footer
        if (Webiny.isElementOfType(child, Row)) {
            this.rowElement = child;
            // Parse Row fields to extract headers
            this.headers = [];
            React.Children.map(child.props.children, rowChild => {
                if (Webiny.elementHasFlag(rowChild, 'tableField')) {
                    if (Webiny.isElementOfType(rowChild, SelectRowField)) {
                        this.selectAllRowsElement = true;
                    }

                    // Only evaluate `hide` condition if it is a plain value (not a function)
                    if (!_.isFunction(rowChild.props.hide) && rowChild.props.hide) {
                        return;
                    }

                    const headerProps = _.omit(rowChild.props, ['renderer', 'headerRenderer']);
                    headerProps.sortable = headerProps.sort || false;
                    headerProps.sorted = this.tempProps.sorters[headerProps.sort] || 0;
                    headerProps.children = React.Children.map(rowChild.props.children, ch => {
                        if (Webiny.isElementOfType(ch, FieldInfo)) {
                            return ch;
                        }
                    });

                    if (_.has(rowChild.props, 'headerRenderer')) {
                        headerProps.renderer = rowChild.props.headerRenderer;
                    }
                    this.headers.push(headerProps);
                }

                if (Webiny.isElementOfType(rowChild, Actions) && !rowChild.props.hide) {
                    this.headers.push({});
                }
            });

            if (this.props.onSelect && !this.selectAllRowsElement) {
                this.headers.splice(0, 0, {renderer: SelectRowField.defaultProps.headerRenderer});
            }
        } else if (Webiny.isElementOfType(child, Footer)) {
            this.footerElement = child;
        } else if (Webiny.isElementOfType(child, Empty)) {
            this.emptyElement = child;
        } else if (Webiny.isElementOfType(child, RowDetails)) {
            this.rowDetailsElement = child;
        }
    }

    showRowDetails(rowIndex) {
        return () => {
            this.state.expandedRows.push(rowIndex);
            this.setState({expandedRows: this.state.expandedRows});
        };
    }

    hideRowDetails(rowIndex) {
        return () => {
            this.state.expandedRows.splice(this.state.expandedRows.indexOf(rowIndex), 1);
            this.setState({expandedRows: this.state.expandedRows});
        };
    }

    toggleRowDetails(rowIndex) {
        return () => {
            if (this.state.expandedRows.indexOf(rowIndex) > -1) {
                this.hideRowDetails(rowIndex)();
            } else {
                this.showRowDetails(rowIndex)();
            }
        };
    }

    prepareChildren(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }
        return React.Children.map(children, this.prepareChild);
    }

    renderRow(data, index, element, key) {
        const props = _.omit(element.props, ['children']);
        _.assign(props, {
            table: this,
            attachToTable: this.attachToTable,
            index,
            key,
            data,
            fieldsCount: this.headers.length + (this.props.onSelect ? 1 : 0),
            expanded: this.state.expandedRows.indexOf(index) > -1,
            selected: !!_.find(this.state.selectedRows, {id: data.id}),
            sorters: _.clone(this.props.sorters),
            actions: _.assign({}, this.props.actions, {
                showRowDetails: this.showRowDetails,
                hideRowDetails: this.hideRowDetails,
                toggleRowDetails: this.toggleRowDetails
            }),
            onSelect: this.props.onSelect ? this.onSelect : null,
            onSelectAll: this.selectAll
        });

        if (this.props.onSelect) {
            props.onSelect = this.onSelect;
        }

        return React.cloneElement(element, props, element.props.children);
    }

    renderHeader(header, i) {
        header.key = i;
        header.onSort = this.onSort;
        header.allRowsSelected = this.state.selectAll;
        header.onSelectAll = this.selectAll;
        return (
            <Header {...header}/>
        );
    }
}

Table.defaultProps = {
    formSkip: true, // tells Form to stop descending into this element's children when looking for form components
    data: [],
    type: 'simple',
    onSelect: null,
    selectedRows: [],
    sorters: {},
    showHeader: true,
    className: null,
    renderer() {

        const typeClasses = {
            simple: styles.simple
        };

        const className = this.classSet([
            styles.table,
            typeClasses[this.props.type],
            this.props.className
        ]);

        if (!this.props.data || !this.props.data.length && this.props.showEmpty) {
            return this.emptyElement || <Empty/>;
        }

        const rows = [];
        this.props.data.map((data, index) => {
            rows.push(this.renderRow(data, data.id || index, this.rowElement, data.id || index));
            if (this.rowDetailsElement) {
                rows.push(this.renderRow(data, data.id || index, this.rowDetailsElement, 'details-' + (data.id || index)));
            }
        });

        let header = null;
        if (this.props.showHeader) {
            header = (
                <thead>
                <tr>
                    {this.headers.map(this.renderHeader)}
                </tr>
                </thead>
            );
        }

        return (
            <table className={className}>
                {header}
                <tbody>{rows}</tbody>
            </table>
        );
    }
};

export default Webiny.createComponent(Table, {styles});
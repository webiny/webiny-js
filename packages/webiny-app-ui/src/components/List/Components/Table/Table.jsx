import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent, isElementOfType, elementHasFlag } from "webiny-app";
import Row from "./Row";
import FieldInfo from "./FieldInfo";
import Actions from "./Actions";
import Footer from "./Footer";
import RowDetails from "./RowDetails";
import Header from "./Header";
import Empty from "./Empty";
import SelectRowField from "./Fields/SelectRowField";
import styles from "../../styles.css?prefix=wui-table";

class Table extends React.Component {
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
            expandedRows: []
        };

        [
            "attachToTable",
            "prepareChildren",
            "prepareChild",
            "renderRow",
            "renderHeader",
            "onSort",
            "onSelect",
            "selectAll",
            "showRowDetails",
            "hideRowDetails",
            "toggleRowDetails"
        ].map(m => (this[m] = this[m].bind(this)));
    }

    shouldComponentUpdate(props) {
        const check = ["data", "selectedRows", "sort"];
        return !_.isEqual(_.pick(props, check), _.pick(this.props, check));
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

        this.setState(
            {
                selectAll: selected
            },
            () => {
                if (this.props.onSelect) {
                    this.props.onSelect(data);
                }
            }
        );
    }

    onSelect(data, selected) {
        const selectedRows = [...this.props.selectedRows];
        if (selected) {
            selectedRows.push(data);
        } else {
            selectedRows.splice(_.findIndex(selectedRows, data), 1);
        }
        this.props.onSelect(selectedRows);
    }

    onSort(name, sort) {
        this.selectAll(false);
        this.setState({ expandedRows: [] });
        const sorters = {...this.props.sort};
        if (sort !== 0) {
            sorters[name] = sort;
        } else {
            delete sorters[name];
        }

        this.props.onSort(sorters);
    }

    prepareChild(child) {
        if (typeof child !== "object" || child === null) {
            return child;
        }

        // Table handles Row and Footer
        if (isElementOfType(child, Row)) {
            this.rowElement = child;
            // Parse Row fields to extract headers
            this.headers = [];
            React.Children.map(child.props.children, rowChild => {
                if (elementHasFlag(rowChild, "tableField")) {
                    if (isElementOfType(rowChild, SelectRowField)) {
                        this.selectAllRowsElement = true;
                    }

                    // Only evaluate `hide` condition if it is a plain value (not a function)
                    if (!_.isFunction(rowChild.props.hide) && rowChild.props.hide) {
                        return;
                    }

                    const headerProps = _.omit(rowChild.props, ["render", "renderHeader"]);
                    headerProps.sortable = headerProps.sort || false;
                    headerProps.sorted = this.props.sort[headerProps.sort] || 0;
                    headerProps.children = React.Children.map(rowChild.props.children, ch => {
                        if (isElementOfType(ch, FieldInfo)) {
                            return ch;
                        }
                    });

                    if (_.has(rowChild.props, "renderHeader")) {
                        headerProps.render = rowChild.props.renderHeader;
                    }
                    this.headers.push(headerProps);
                }

                if (isElementOfType(rowChild, Actions) && !rowChild.props.hide) {
                    this.headers.push({});
                }
            });

            if (this.props.onSelect && !this.selectAllRowsElement) {
                this.headers.splice(0, 0, { render: SelectRowField.defaultProps.renderHeader });
            }
        } else if (isElementOfType(child, Footer)) {
            this.footerElement = child;
        } else if (isElementOfType(child, Empty)) {
            this.emptyElement = child;
        } else if (isElementOfType(child, RowDetails)) {
            this.rowDetailsElement = child;
        }
    }

    showRowDetails(rowIndex) {
        return () => {
            this.state.expandedRows.push(rowIndex);
            this.setState({ expandedRows: this.state.expandedRows });
        };
    }

    hideRowDetails(rowIndex) {
        return () => {
            this.state.expandedRows.splice(this.state.expandedRows.indexOf(rowIndex), 1);
            this.setState({ expandedRows: this.state.expandedRows });
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
        if (typeof children !== "object" || children === null) {
            return children;
        }
        return React.Children.map(children, this.prepareChild);
    }

    renderRow(data, index, element, key) {
        const props = _.omit(element.props, ["children"]);
        _.assign(props, {
            attachToTable: this.attachToTable,
            index,
            key,
            data,
            fieldsCount: this.headers.length + (this.props.onSelect ? 1 : 0),
            expanded: this.state.expandedRows.indexOf(index) > -1,
            selected: !!_.find(this.props.selectedRows, { id: data.id }),
            sort: { ...this.props.sort },
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
        return <Header {...header} />;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        this.prepareChildren(this.props.children);

        const typeClasses = {
            simple: styles.simple
        };

        const className = classSet([
            styles.table,
            typeClasses[this.props.type],
            this.props.className
        ]);

        if (!this.props.data || (!this.props.data.length && !this.props.loading)) {
            return this.emptyElement || <Empty />;
        }

        const rows = [];
        this.props.data.map((data, index) => {
            rows.push(this.renderRow(data, data.id || index, this.rowElement, data.id || index));
            if (this.rowDetailsElement) {
                rows.push(
                    this.renderRow(
                        data,
                        data.id || index,
                        this.rowDetailsElement,
                        "details-" + (data.id || index)
                    )
                );
            }
        });

        let header = null;
        if (this.props.showHeader) {
            header = (
                <thead>
                    <tr>{this.headers.map(this.renderHeader)}</tr>
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
}

Table.defaultProps = {
    formSkip: true, // tells Form to stop descending into this element's children when looking for form components
    data: [],
    type: "simple",
    onSelect: null,
    selectedRows: [],
    sort: {},
    showHeader: true,
    className: null
};

export default createComponent(Table, { styles, listDataComponent: true });

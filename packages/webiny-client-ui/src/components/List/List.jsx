import React from "react";
import _ from "lodash";
import { inject, elementHasFlag } from "webiny-client";
import styles from "./styles.module.css";

@inject({
    modules: ["Grid"],
    styles
})
class List extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedRows: []
        };
    }

    onSelect(selectedRows) {
        this.setState({ selectedRows });
    }

    tableProps(tableProps) {
        _.assign(tableProps, {
            data: _.cloneDeep(this.props.list),
            sort: _.cloneDeep(this.props.sort),
            onSort: this.props.setSort.bind(this),
            selectedRows: [...this.state.selectedRows]
        });

        return tableProps;
    }

    paginationProps(paginationProps) {
        _.assign(paginationProps, {
            onPageChange: this.props.setPage.bind(this),
            onPerPageChange: this.props.setPerPage.bind(this),
            currentPage: this.props.page,
            perPage: this.props.perPage,
            count: _.get(this.props.meta, "count", 0),
            totalCount: _.get(this.props.meta, "totalCount", 0),
            totalPages: _.get(this.props.meta, "totalPages", 0)
        });

        return paginationProps;
    }

    multiActionsProps(multiActionsProps) {
        _.assign(multiActionsProps, {
            data: this.state.selectedRows
        });

        return multiActionsProps;
    }

    /**
     * @private
     * @param children
     * @param listProps
     */
    prepareList(children, listProps) {
        React.Children.map(
            children,
            child => {
                if (elementHasFlag(child, "listFiltersComponent")) {
                    // Need to omit fields that are not actual filters
                    this.filterElement = React.cloneElement(child, {
                        filter: { ...this.props.filter, search: this.props.search },
                        onFilter: this.props.setFilter.bind(this)
                    });
                }

                const props = _.omit(child.props, ["children", "key", "ref"]);
                if (elementHasFlag(child, "listDataComponent")) {
                    this.dataElement = React.cloneElement(child, {
                        ...this.tableProps(props),
                        ...listProps
                    });
                }

                if (elementHasFlag(child, "listPaginationComponent")) {
                    this.paginationElement = React.cloneElement(child, {
                        ...this.paginationProps(props),
                        ...listProps
                    });
                }

                if (elementHasFlag(child, "listMultiActionsComponent")) {
                    this.multiActionsElement = React.cloneElement(child, {
                        ...this.multiActionsProps(props),
                        ...listProps
                    });
                }
            },
            this
        );

        // If MultiActions are present, pass an onSelect callback to Table which will tell Table to allow selection
        // and execute onSelect callback when selection is changed
        if (this.multiActionsElement) {
            this.dataElement = React.cloneElement(this.dataElement, {
                onSelect: this.onSelect.bind(this)
            });
        }
    }

    render() {
        const content = React.Children.toArray(this.props.children);

        if (!content) {
            return null;
        }

        const listProps = {
            actions: this.props.actions
        };

        this.prepareList(content, listProps);

        const layoutProps = {
            list: this.props.list,
            meta: this.props.meta,
            filterElement: this.filterElement,
            dataElement: this.dataElement,
            paginationElement: this.paginationElement,
            multiActionsElement: this.multiActionsElement,
            ...listProps
        };

        return this.props.renderLayout.call(this, layoutProps);
    }
}

List.defaultProps = {
    onInitialLoad: _.noop,
    onLoad: _.noop,
    autoLoad: true,
    autoRefresh: null,
    prepareLoadedData: null,
    renderLayout({
        filterElement,
        dataElement,
        paginationElement,
        multiActionsElement
    }) {
        const { modules: { Grid }, styles } = this.props;
        return (
            <webiny-list-layout>
                {filterElement}
                {dataElement}
                <Grid.Row className={styles.footer}>
                    <Grid.Col sm={4} className={styles.multiAction}>
                        {multiActionsElement}
                    </Grid.Col>
                    <Grid.Col sm={8} className={styles.paginationWrapper}>
                        {paginationElement}
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-layout>
        );
    }
};

export default List;

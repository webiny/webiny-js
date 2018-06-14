import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { Component, i18n } from "webiny-client";
import styles from "../styles.css?prefix=Webiny_Ui_List_Pagination";

const t = i18n.namespace("Webiny.Ui.List.Pagination");
@Component({
    modules: ["Grid", "Dropdown"],
    styles,
    listPaginationComponent: true
})
class Pagination extends React.Component {
    constructor(props) {
        super(props);

        this.renderPages = this.renderPages.bind(this);
    }

    pageChanged(page) {
        if (page === this.props.currentPage) {
            return;
        }

        this.props.onPageChange(page);
    }

    renderPages() {
        const cp = parseInt(this.props.currentPage);
        const tp = this.props.totalPages;
        let showLowDots = false;
        let showHighDots = false;
        const showPages = this.props.size === "large" ? 9 : 7;
        const padding = this.props.size === "large" ? 2 : 1;

        let pages = [];
        if (tp <= showPages) {
            pages = tp > 1 ? _.range(1, tp + 1) : [1];
        } else {
            if (cp - padding > 3) {
                showLowDots = true;
            }

            if (cp + (padding + 2) < tp) {
                showHighDots = true;
            }

            if (showLowDots && showHighDots) {
                pages = [1, null];
                let i = cp - padding;
                for (i; i <= cp + padding; i++) {
                    pages.push(i);
                }
                pages.push(null);
                pages.push(tp);
            } else if (showLowDots) {
                pages = _.range(tp - showPages + 3, tp + 1);
                pages.unshift(null);
                pages.unshift(1);
            } else if (showHighDots) {
                pages = _.range(1, showPages - 1);
                pages.push(null);
                pages.push(tp);
            }
        }

        return _.map(pages, (page, i) => {
            const key = page !== null ? page + "-" + i : "dots-" + i;
            const onClick = page !== null ? this.pageChanged.bind(this, page) : null;
            const className = cp === page ? this.props.styles.active : null;
            return (
                <li key={key} className={className} onClick={onClick}>
                    <a href="javascript:void(0);">{page || "..."}</a>
                </li>
            );
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (!this.props.count) {
            return null;
        }

        const { modules: { Grid }, styles } = this.props;
        const cp = parseInt(this.props.currentPage);
        const previousPage = cp === 1 ? null : this.pageChanged.bind(this, cp - 1);
        const previousClasses = classSet(styles.previous, {
            [styles.disabled]: cp === 1
        });

        const nextPage = cp === this.props.totalPages ? null : this.pageChanged.bind(this, cp + 1);
        const nextClasses = classSet(styles.next, {
            [styles.disabled]: cp === this.props.totalPages
        });

        return (
            <webiny-list-pagination>
                <Grid.Row>
                    <Grid.Col all={12}>
                        <ul className={classSet(styles.pagination)}>
                            <li className={previousClasses} onClick={previousPage}>
                                <a href="javascript:void(0)">
                                    <span className="icon icon-caret-down" />
                                    <span>{t`PREVIOUS`}</span>
                                </a>
                            </li>
                            {this.renderPages()}
                            <li className={nextClasses} onClick={nextPage}>
                                <a href="javascript:void(0)">
                                    <span>{t`NEXT`}</span>
                                    <span className="icon icon-caret-down" />
                                </a>
                            </li>
                        </ul>
                    </Grid.Col>
                    <Grid.Col all={12}>
                        {this.props.renderPerPage.call(this)}
                        <span>
                            Total number of records: <strong>{this.props.totalCount}</strong>
                        </span>
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-pagination>
        );
    }
}

Pagination.defaultProps = {
    onPageChange: _.noop,
    onPerPageChange: _.noop,
    totalPages: 0,
    currentPage: 0,
    perPage: 0,
    perPageOptions: [10, 25, 50, 100],
    count: 0,
    totalCount: 0,
    size: "large", // large or small
    renderPerPage() {
        const { modules: { Dropdown }, perPageOptions } = this.props;
        return (
            <Dropdown
                title={
                    <span>
                        <strong>{this.props.perPage}</strong> per page
                    </span>
                }
                type="balloon"
            >
                <Dropdown.Header title={t`Results per page`} />
                {perPageOptions.map(option => (
                    <Dropdown.Link
                        key={option}
                        title={option}
                        onClick={() => this.props.onPerPageChange(option)}
                    />
                ))}
            </Dropdown>
        );
    }
};

export default Pagination;

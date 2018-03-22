import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from '../styles.css';

/**
 * @i18n.namespace Webiny.Ui.List.Pagination
 */
class Pagination extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('renderPages,renderPerPage');
    }

    pageChanged(page) {
        if (page === this.props.currentPage) {
            return;
        }

        this.props.onPageChange(page);
    }

    renderPerPage() {
        return this.props.perPageRenderer.call(this);
    }

    renderPages() {
        const cp = parseInt(this.props.currentPage);
        const tp = this.props.totalPages;
        let showLowDots = false;
        let showHighDots = false;
        const showPages = this.props.size === 'large' ? 9 : 7;
        const padding = this.props.size === 'large' ? 2 : 1;

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
            const key = page !== null ? page + '-' + i : 'dots-' + i;
            const onClick = page !== null ? this.pageChanged.bind(this, page) : null;
            const className = cp === page ? this.props.styles.active : null;
            return (
                <li key={key} className={className} onClick={onClick}>
                    <a href="javascript:void(0);">{page || '...'}</a>
                </li>
            );
        });
    }
}

Pagination.defaultProps = {
    onPageChange: _.noop,
    onPerPageChange: _.noop,
    totalPages: 0,
    currentPage: 0,
    perPage: 0,
    perPageOptions: [10, 25, 50],
    count: 0,
    totalCount: 0,
    size: 'large', // large or small
    perPageRenderer() {
        const {Dropdown, perPageOptions} = this.props;
        return (
            <Dropdown title={<span><strong>{this.props.perPage}</strong> per page</span>} type="balloon">
                <Dropdown.Header title={this.i18n('Results per page')}/>
                {perPageOptions.map(option => (
                    <Dropdown.Link key={option} title={option} onClick={() => this.props.onPerPageChange(option)}/>
                ))}
            </Dropdown>
        );
    },
    renderer() {
        if (!this.props.count) {
            return null;
        }

        const {Grid, styles} = this.props;
        const cp = parseInt(this.props.currentPage);
        const previousPage = cp === 1 ? null : this.pageChanged.bind(this, cp - 1);
        const previousClasses = this.classSet(
            styles.previous,
            {
                [styles.disabled]: cp === 1
            }
        );

        const nextPage = cp === this.props.totalPages ? null : this.pageChanged.bind(this, cp + 1);
        const nextClasses = this.classSet(
            styles.next,
            {
                [styles.disabled]: cp === this.props.totalPages
            }
        );

        return (
            <webiny-list-pagination>
                <Grid.Row>
                    <Grid.Col all={12}>
                        {this.renderPerPage()}
                        <ul className={this.classSet(styles.pagination)}>
                            <li className={previousClasses} onClick={previousPage}>
                                <a href="javascript:void(0)">
                                    <span className="icon icon-caret-down"/>
                                    <span>{this.i18n('PREVIOUS')}</span>
                                </a>
                            </li>
                            {this.renderPages()}
                            <li className={nextClasses} onClick={nextPage}>
                                <a href="javascript:void(0)">
                                    <span>{this.i18n('NEXT')}</span>
                                    <span className="icon icon-caret-down"/>
                                </a>
                            </li>
                        </ul>
                    </Grid.Col>
                </Grid.Row>
            </webiny-list-pagination>
        );
    }
};

export default Webiny.createComponent(Pagination, {modules: ['Grid', 'Dropdown'], styles});
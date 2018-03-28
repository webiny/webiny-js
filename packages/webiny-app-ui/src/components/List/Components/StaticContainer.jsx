import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-app';
import BaseContainer from './BaseContainer';

// TODO: not finished!

class StaticContainer extends React.Component {

    componentWillMount() {
        this.loadData(this.props);
    }

    async componentWillReceiveProps(props) {
        if (_.isEqual(props.data, this.props.data)) {
            return;
        }
        await this.prepare(props);
        this.loadData(props);
    }

    loadData(props) {
        const propsData = _.get(props, 'data', this.props.data);
        let data = _.isEmpty(this.props.filters) ? propsData : _.filter(propsData, this.props.filters);
        const fields = [];
        const order = [];
        const sorters = Object.keys(this.props.sorters).length ? this.props.sorters : this.props.initialSorters;
        _.each(sorters, (sort, field) => {
            fields.push(field);
            order.push(sort === 1 ? 'asc' : 'desc');
        });
        data = _.orderBy(data, fields, order);


        const meta = {
            currentPage: this.props.page,
            perPage: this.props.perPage,
            totalCount: data.length,
            totalPages: Math.ceil(data.length / this.props.perPage)
        };

        this.totalPages = meta.totalPages;

        const from = (this.props.page - 1) * this.props.perPage;
        const newState = _.assign({
            list: data.slice(from, from + this.props.perPage),
            meta,
            selectedRows: []
        });

        return new Promise(resolve => this.setState(newState, resolve));
    }
}

StaticContainer.defaultProps = {
    connectToRouter: false,
    page: 1,
    perPage: 10,
    layout({ filters, table, pagination }) {
        return (
            <webiny-list-layout>
                {filters}
                {table}
                {pagination}
            </webiny-list-layout>
        );
    }
};

export default createComponent([StaticContainer, BaseContainer]);
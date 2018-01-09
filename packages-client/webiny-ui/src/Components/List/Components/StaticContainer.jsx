import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import BaseContainer from './BaseContainer';

class StaticContainer extends BaseContainer {

    componentWillMount() {
        super.componentWillMount();
        this.prepare(this.props).then(() => {
            this.loadData(this.props);
        });
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (_.isEqual(props.data, this.props.data)) {
            return;
        }
        this.prepare(props).then(() => {
            this.loadData(props);
        });
    }

    loadData(props) {
        const propsData = _.get(props, 'data', this.props.data);
        let data = _.isEmpty(this.state.filters) ? propsData : _.filter(propsData, this.state.filters);
        const fields = [];
        const order = [];
        const sorters = Object.keys(this.state.sorters).length ? this.state.sorters : this.state.initialSorters;
        _.each(sorters, (sort, field) => {
            fields.push(field);
            order.push(sort === 1 ? 'asc' : 'desc');
        });
        data = _.orderBy(data, fields, order);


        const meta = {
            currentPage: this.state.page,
            perPage: this.state.perPage,
            totalCount: data.length,
            totalPages: Math.ceil(data.length / this.state.perPage)
        };

        this.totalPages = meta.totalPages;

        const from = (this.state.page - 1) * this.state.perPage;
        const newState = _.assign({
            list: data.slice(from, from + this.state.perPage),
            meta,
            selectedRows: []
        });

        return new Promise(resolve => this.setState(newState, resolve));
    }
}

StaticContainer.defaultProps = _.merge({}, BaseContainer.defaultProps, {
    connectToRouter: false,
    page: 1,
    perPage: 10,
    layout() {
        return (
            <webiny-list-layout>
                <filters/>
                <table/>
                <pagination/>
            </webiny-list-layout>
        );
    }
});

export default Webiny.createComponent(StaticContainer);
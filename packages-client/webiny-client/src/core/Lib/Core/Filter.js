import _ from 'lodash';
const registeredFilters = {};

function parseFilters(filters) {
    if (!filters) {
        return {};
    }
    const splitFilters = filters.split(',');
    filters = {};
    splitFilters.forEach(v => {
        const filter = v.split(':');
        const vName = filter.shift();
        filters[vName] = filter;
    });
    return filters;
}

function getFilter(filter) {
    return registeredFilters[filter];
}

function Filter(value, filtersToApply) {
    _.forEach(parseFilters(filtersToApply), (params, filter) => {
        value = getFilter(filter)(value, ...params);
    });
    return value;
}

Filter.getFilters = function () {
    return registeredFilters;
};

Filter.addFilter = function addFilter(name, callable) {
    if (!_.has(registeredFilters[name])) {
        registeredFilters[name] = callable;
    }
    return this;
};

export default Filter;
import _ from 'lodash';
import ApiEndpoint from './../Api/Endpoint';

const apiProps = [
    'fields',
    'page',
    'perPage',
    'sort',
    'searchFields',
    'searchQuery',
    'searchOperator'
];

function normalizeParams(params) {
    const verifiedParams = {};
    _.each(params, (v, k) => {
        if (k === 'fields' || k === '_fields') {
            v = v.replace(' ', '');
        }
        if (apiProps.indexOf(k) > -1) {
            verifiedParams['_' + k] = v;
        } else {
            verifiedParams[k] = v;
        }
    });
    return verifiedParams;
}

class ApiComponent {

    static extend(context) {
        if (context.props.api) {
            if (_.isString(context.props.api)) {
                const config = _.pick(context.props, ['httpMethod', 'url', 'body', 'query']);
                if (!config.query || _.isPlainObject(config.query)) {
                    config.query = _.merge({}, config.query, _.pick(context.props, apiProps));
                }
                config.context = {props: _.omit(context.props, ['children', 'renderer'])};
                context.api = new ApiEndpoint(context.props.api, config);
            } else {
                context.api = context.props.api;
                if (context.props.url) {
                    context.api.setUrl(context.props.url);
                }
                const apiQuery = context.api.getQuery();
                _.merge(apiQuery, normalizeParams(_.pick(context.props, apiProps)));
                context.api.setQuery(apiQuery);
            }
        }
    }
}

export default ApiComponent;

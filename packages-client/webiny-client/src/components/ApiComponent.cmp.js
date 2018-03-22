import React from "react";
import _ from "lodash";
import axios from "axios";

const apiProps = [
    "fields",
    "page",
    "perPage",
    "sort",
    "searchFields",
    "searchQuery",
    "searchOperator"
];

const getApiProps = props => {
    const res = {};
    Object.keys(props).map(key => {
        if (apiProps.includes(key)) {
            res[`_${key}`] = props[key];
        }
    });

    return res;
};

class ApiComponent extends React.Component {
    constructor(props) {
        super(props);

        if (props.api) {
            const config = _.pick(props, ["method", "url", "body", "query"]);
            if (!config.query || _.isPlainObject(config.query)) {
                config.query = _.merge({}, config.query, getApiProps(props));
            }
            this.api = axios.create({
                method: config.method || "get",
                baseURL: axios.defaults.baseURL,
                url: config.url ? props.api + config.url : props.api,
                params: config.query,
                data: config.body
            });
        }
    }

    render() {
        return React.cloneElement(this.props.children, {
            ..._.omit(this.props, "children"),
            api: this.api
        });
    }
}

export default ApiComponent;

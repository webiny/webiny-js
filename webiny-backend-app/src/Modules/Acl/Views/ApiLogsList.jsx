import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.Acl.ApiLogsList
 */
class ApiLogsList extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.state = {
            token: null,
            tokens: []
        };

        this.systemToken = {
            id: 'system',
            description: 'System Token'
        };

        this.incognitoRequests = {
            id: 'incognito',
            description: 'Incognito Requests'
        };
    }

    componentWillMount() {
        super.componentWillMount();

        // Set requested token data to render view title
        this.setToken(Webiny.Router.getParams('token'));

        this.prepareTokenOptions();
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        this.setToken(Webiny.Router.getParams('token'));
    }

    setToken(token) {
        if (!token) {
            return this.setState({token: null});
        }

        if (token === 'system') {
            this.setState({token: this.systemToken});
        } else if (token === 'incognito') {
            this.setState({token: this.incognitoRequests});
        } else {
            this.loadToken(token);
        }
    }

    loadToken(id) {
        return new Webiny.Api.Endpoint('/entities/webiny/api-tokens').get(id, {_fields: 'owner,description'}).then(apiResponse => {
            this.setState({token: apiResponse.getData('entity')});
        });
    }

    prepareTokenOptions() {
        const options = [this.incognitoRequests];
        // Check if current user has permissions to view system token and its logs
        return new Webiny.Api.Endpoint('/services/webiny/acl').get('token').then(apiResponse => {
            if (!apiResponse.isError()) {
                // Great, the user can view system token
                options.push(this.systemToken);
            }

            // Load other API tokens
            return new Webiny.Api.Endpoint('/entities/webiny/api-tokens').get('/', {_fields: 'id,owner,description'}).then(apiResponse => {
                if (!apiResponse.isError()) {
                    apiResponse.getData('list').map(token => options.push(token));
                }
                this.setState({tokens: options});
            });
        });
    }

    renderUrlField(row) {
        const {createdBy: user, token, request, method} = row;
        let userLabel = null;
        let tokenLabel = null;

        const {Ui} = this.props;

        if (!_.isNil(token)) {
            if (token === 'system') {
                tokenLabel = (
                    <Ui.Label type="error" inline>System token</Ui.Label>
                );
            } else {
                tokenLabel = (
                    <Ui.Label type="success" inline>
                        {token.description} ({token.owner})
                    </Ui.Label>
                );
            }
        }

        if (!_.isNil(user) && !tokenLabel) {
            userLabel = (
                <Ui.Label type="default" inline>
                    {user.firstName} {user.lastName} ({user.email})
                </Ui.Label>
            );
        }

        if (!user && !token) {
            tokenLabel = (
                <Ui.Label type="default" inline>Incognito</Ui.Label>
            );
        }

        return (
            <field>
                {request.url}<br/>
                <Ui.Label type="info" inline>{method}</Ui.Label>
                {userLabel}
                {tokenLabel}
            </field>
        );
    }

    renderTokenOption({option}) {
        let desc = option.data.description;
        if (option.data.owner) {
            desc += ` (${option.data.owner})`;
        }
        return desc;
    }
}

ApiLogsList.defaultProps = {
    renderer() {
        const listProps = {
            api: '/entities/webiny/api-logs',
            fields: '*,createdOn,createdBy[id,firstName,lastName,email],token[id,description,owner]',
            query: {
                token: Webiny.Router.getParams('token')
            },
            sort: '-createdOn',
            searchFields: 'request.method,request.url',
            layout: null,
            connectToRouter: true
        };

        const {Ui} = this.props;

        let title = null;
        if (this.state.token) {
            title = this.state.token.description;
            if (this.state.token.owner) {
                title += ` (${this.state.token.owner})`;
            }
        }

        return (
            <Ui.View.List>
                <Ui.View.Header
                    title={this.state.token ? this.i18n(`ACL - API Logs: {title}`, {title}) : this.i18n('ACL - API Logs')}
                    description={this.i18n('Here you can view all API request logs.')}/>
                <Ui.View.Body>
                    <Ui.List {...listProps}>
                        {({list}) => {
                            return (
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.List.FormFilters>
                                            {({apply}) => (
                                                <Ui.Grid.Row>
                                                    <Ui.Grid.Col all={3}>
                                                        <Ui.Input
                                                            name="_searchQuery"
                                                            placeholder={this.i18n('Search by method or URL')}
                                                            onEnter={apply()}/>
                                                    </Ui.Grid.Col>
                                                    <Ui.Grid.Col all={3}>
                                                        <Ui.Select
                                                            api="/entities/webiny/api-logs/methods"
                                                            name="method"
                                                            placeholder={this.i18n('Filter by HTTP method')}
                                                            allowClear
                                                            onChange={apply()}/>
                                                    </Ui.Grid.Col>
                                                    <Ui.Grid.Col all={3}>
                                                        <Ui.Select
                                                            options={this.state.tokens}
                                                            optionRenderer={this.renderTokenOption}
                                                            selectedRenderer={this.renderTokenOption}
                                                            name="token"
                                                            placeholder={this.i18n('Filter by token')}
                                                            allowClear
                                                            onChange={apply()}/>
                                                    </Ui.Grid.Col>
                                                    <Ui.Grid.Col all={3}>
                                                        <Ui.Search
                                                            api="/entities/webiny/users"
                                                            fields="id,firstName,lastName,email"
                                                            searchFields="firstName,lastName,email"
                                                            optionRenderer={({option: {data: item}}) => `${item.firstName} ${item.lastName} (${item.email})`}
                                                            selectedRenderer={({option: {data: item}}) => `${item.firstName} ${item.lastName} (${item.email})`}
                                                            name="createdBy"
                                                            placeholder={this.i18n('Filter by user')}
                                                            onChange={apply()}/>
                                                    </Ui.Grid.Col>
                                                </Ui.Grid.Row>
                                            )}
                                        </Ui.List.FormFilters>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.List.Loader/>
                                        <Ui.List.Table.Empty renderIf={!list.length}/>
                                        <Ui.ExpandableList>
                                            {list.map(row => {
                                                return (
                                                    <Ui.ExpandableList.Row key={row.id}>
                                                        <Ui.ExpandableList.Field all={9} name="URL" className="text-left">
                                                            {this.renderUrlField(row)}
                                                        </Ui.ExpandableList.Field>
                                                        <Ui.ExpandableList.Field all={3} name="Created On" className="text-center">
                                                            <span>
                                                                <Ui.Filters.TimeAgo value={row.createdOn}/>
                                                                <br/>
                                                                <Ui.Filters.DateTime value={row.createdOn}/>
                                                            </span>
                                                        </Ui.ExpandableList.Field>
                                                        <Ui.ExpandableList.RowDetailsList title={row.request.url}>
                                                            <Ui.CodeHighlight language="json">
                                                                {JSON.stringify(row.request, null, 2)}
                                                            </Ui.CodeHighlight>
                                                        </Ui.ExpandableList.RowDetailsList>
                                                    </Ui.ExpandableList.Row>
                                                );
                                            })}
                                        </Ui.ExpandableList>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.List.Pagination/>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                            );
                        }}
                    </Ui.List>
                </Ui.View.Body>
            </Ui.View.List>
        );
    }
};

export default Webiny.createComponent(ApiLogsList, {
    modulesProp: 'Ui',
    modules: ['View', 'Link', 'List', 'Grid', 'Input', 'ExpandableList', 'Label', 'CodeHighlight', 'Select', 'Search', 'Filters']
});
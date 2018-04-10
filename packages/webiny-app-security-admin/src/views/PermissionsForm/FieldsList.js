import React from "react";
import _ from "lodash";
import axios from "axios";

import css from "./styles.css";
import EndpointBox from "./AccessBox/EndpointBox";
import AddEndpointModal from "./AddEndpointModal";
import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EndpointPermissions");

class EndpointPermissions extends React.Component {
    constructor() {
        super();
        this.state = {
            endpoints: [],
            loading: false
        };
    }

    componentWillMount() {
        if (this.props.model.rules.length) {
            // Optionally the request above could also be done as
            this.setState({ loading: false }, () => {
                axios
                    .get("/discover", {
                        params: {
                            include: _.map(this.props.model.rules, "classId")
                        }
                    })
                    .then(response => {
                        this.setState({ loading: false, endpoints: response.data.data.list });
                    });
            });
        }
    }

    render() {
        const { Loader, Button, ViewSwitcher, Grid, Icon } = this.props;

        return (
            <ViewSwitcher>
                <ViewSwitcher.View view="form" defaultView>
                    {({ showView }) => (
                        <div className={css.endpointPermissionsWrapper}>
                            {this.state.loading && <Loader />}
                            <Grid.Row className={css.addAction}>
                                <Grid.Col all={12} className="text-center">
                                    <Button type="primary" onClick={showView("addEndpointModal")}>
                                        <Icon icon="icon-plus-circled" />
                                        {t`Add endpoint`}
                                    </Button>
                                </Grid.Col>
                            </Grid.Row>

                            {_.isEmpty(this.state.endpoints) ? (
                                <Grid.Row>
                                    <Grid.Col all={12} className="text-center">
                                        <div>
                                            <h2>{t`No endpoints selected.`}</h2>
                                            <p
                                            >{t`To manage access, please add an endpoint first.`}</p>
                                        </div>
                                    </Grid.Col>
                                </Grid.Row>
                            ) : (
                                <Grid.Row className={css.accessBoxesWrapper}>
                                    {this.state.endpoints.map(endpoint => {
                                        return (
                                            <EndpointBox
                                                currentlyEditingPermission={this.props.model}
                                                onToggleMethod={(endpoint, method) =>
                                                    this.props.onToggleMethod(endpoint, method)
                                                }
                                                onRemoveEndpoint={endpoint => {
                                                    const index = _.findIndex(
                                                        this.state.endpoints,
                                                        {
                                                            classId: endpoint.classId
                                                        }
                                                    );
                                                    const endpoints = _.clone(this.state.endpoints);
                                                    endpoints.splice(index, 1);
                                                    this.setState({ endpoints }, () => {
                                                        this.props.onRemoveEndpoint(endpoint);
                                                        app.services
                                                            .get("growler")
                                                            .success(
                                                                t`Endpoint removed successfully!`
                                                            );
                                                    });
                                                }}
                                                key={endpoint.classId}
                                                endpoint={endpoint}
                                            />
                                        );
                                    })}
                                </Grid.Row>
                            )}
                        </div>
                    )}
                </ViewSwitcher.View>

                <ViewSwitcher.View view="addEndpointModal" modal>
                    {() => (
                        <AddEndpointModal
                            name="addEndpointModal"
                            exclude={this.state.endpoints}
                            onSubmit={endpoint => {
                                this.setState(
                                    { endpoints: _.clone(this.state.endpoints).concat([endpoint]) },
                                    () => {
                                        this.props.onAddEndpoint(endpoint);
                                        app.services
                                            .get("growler")
                                            .success(t`Endpoint was added successfully!`);
                                    }
                                );
                            }}
                        />
                    )}
                </ViewSwitcher.View>
            </ViewSwitcher>
        );
    }
}

EndpointPermissions.defaultProps = {
    model: null,
    onToggleMethod: _.noop,
    onAddEndpoint: _.noop,
    onRemoveEndpoint: _.noop
};

export default createComponent(EndpointPermissions, {
    modules: ["Input", "Button", "ViewSwitcher", "Grid", "Icon", "Loader"]
});

import React from "react";
import Access from "./EntitiesForm/Access";
import gql from "graphql-tag";

import { app, i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesForm");

class EntitiesForm extends React.Component {
    constructor() {
        super();
        this.state = {
            model: null,
            entities: {
                list: []
            }
        };

        const query = gql`
            {
                getEntityPermission(id: "${app.router.getParams("id")}") {
                    entity { id attributes } permissions { owner group other }
                }
                listEntities {
                    list {
                      id
                      name
                    }
                }
            }
        `;

        app.graphql.query({ query }).then(({ data }) => {
            this.setState(state => {
                state.model = data.getEntityPermission;
                state.entities = data.listEntities;
                return state;
            });
        });
    }

    render() {
        const { AdminLayout, View, Grid, Button } = this.props.modules;

        return (
            <AdminLayout>
                <View.Form>
                    <View.Header title={t`Security - Edit entity`} />
                    <View.Body>
                        <Grid.Row>
                            <Grid.Col all={12}>
                                <Access model={this.state.model} form={this} />
                            </Grid.Col>
                        </Grid.Row>
                    </View.Body>
                    <View.Footer>
                        <Button
                            type="default"
                            onClick={() => app.router.goToRoute("Entities.List")}
                            label={t`Go back`}
                        />
                    </View.Footer>
                </View.Form>
            </AdminLayout>
        );
    }
}

export default createComponent(EntitiesForm, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "Form",
        "FormData",
        "FormError",
        "View",
        "Grid",
        "Button",
        "Loader"
    ]
});

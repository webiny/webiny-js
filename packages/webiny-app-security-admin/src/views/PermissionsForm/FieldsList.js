import React from "react";
import _ from "lodash";
import Field from "./Field";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.FieldsList");

class FieldsList extends React.Component {
    constructor() {
        super();
        this.state = {
            endpoints: [],
            loading: false,
            filter: ""
        };
    }

    render() {
        const { Grid, Input } = this.props.modules;

        const fields = this.props.fields.filter(item => {
            return (
                !this.state.filter ||
                item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1 ||
                (typeof item.description === "string" &&
                    item.description.toLowerCase().indexOf(this.state.filter.toLowerCase()) > -1)
            );
        });

        const enabledFields = this.props.model.fields || [];
        return (
            <div>
                <Grid.Row>
                    <Grid.Col md={12}>
                        <Input
                            value={this.state.filter}
                            placeholder={t`Search by name or description`}
                            onChange={filter => this.setState({ filter })}
                        />
                    </Grid.Col>
                </Grid.Row>
                <Grid.Row>
                    {fields.map(item => (
                        <Grid.Col key={item.name} md={4} lg={3}>
                            <Field
                                enabled={enabledFields.indexOf(item.name) > -1}
                                data={item}
                                onToggleField={this.props.onToggleField}
                            />
                        </Grid.Col>
                    ))}
                </Grid.Row>
            </div>
        );
    }
}

FieldsList.defaultProps = {
    model: null,
    onToggleField: _.noop,
    fields: []
};

export default createComponent(FieldsList, {
    modules: ["Input", "Grid"]
});

// eslint-disable
import { Component } from "react";
import { createComponent } from "webiny-app";
import { FormData, OptionsData, ListData } from "webiny-graphql-ui";

class View extends Component {
    constructor() {
        super();
        this.state = {};
    }

    checkWeather(onSubmit) {
        return async ({ model, form }) => {
            try {
                await weatherApi.check();
                onSubmit(model);
            } catch (err) {
                // too cold bro
                this.setState({ error: err });
            }
        };
    }

    render() {
        return (
            <FormData entity="SecurityUser" withRouter>
                {({ model, onSubmit, loading, error, invalidFields }) => (
                    <Form
                        model={model}
                        onSubmit={this.checkWeather(onSubmit)}
                        invalidFields={invalidFields}
                    >
                        {({ model, form, Bind }) => (
                            <View.Form>
                                <View.Header title={"User form"} />
                                {this.state.error && (
                                    <View.Error>
                                        <CustomError />
                                    </View.Error>
                                )}
                                <View.Body>
                                    <Tabs ref={(ref = this.tabs = ref)}>
                                        <Tabs.Tab label="Tab 1">
                                            <Bind>
                                                <Input name={"email"} />
                                            </Bind>
                                            <Bind>
                                                <Date name={"createdOn"} />
                                            </Bind>
                                            <Bind>
                                                <RadioGroup
                                                    name={"createdOn"}
                                                    onChange={() => this.tabs.selectTab(2)}
                                                />
                                            </Bind>
                                        </Tabs.Tab>
                                        <Tabs.Tab label="Tab 2">
                                            <OptionsData
                                                entity={"CmsCategories"}
                                                fields={"id name"}
                                                filter={{ enabled: true }}
                                            >
                                                {({ options, loading }) => (
                                                    <Bind>
                                                        <Select
                                                            label="Category"
                                                            name={"category"}
                                                            allowClear={true}
                                                        />
                                                    </Bind>
                                                )}
                                            </OptionsData>
                                            <OptionsData
                                                filterBy="category"
                                                entity={"CmsCategories"}
                                                fields={"id name"}
                                            >
                                                {({ options, loading }) => (
                                                    <Bind>
                                                        <CheckboxGroup
                                                            disabled={loading}
                                                            name={"assignee"}
                                                            options={options}
                                                        />
                                                    </Bind>
                                                )}
                                            </OptionsData>
                                        </Tabs.Tab>
                                    </Tabs>
                                </View.Body>
                            </View.Form>
                        )}
                    </Form>
                )}
            </FormData>
        );
    }

    renderList() {
        return (
            <View.List>
                <View.Header
                    title={t`My List`}
                    description={t`Your list of records. Click the button on the right to create a new record.`}
                >
                    <Link type="primary" align="right">
                        <Icon icon={["fa", "plus-circle"]} /> {t`New record`}
                    </Link>
                </View.Header>
                <View.Body>
                    <ListData
                        withRouter
                        entity={"CmsPage"}
                        perPage={10}
                        sort={{ email: -1 }}
                        fields={"id firstName email createdOn enabled"}
                        search={{ fields: ["email", "firstName"] }}
                    >
                        {({ loading, ...props }) => (
                            <List>
                                <List.Table />
                                <List.Pagination />
                            </List>
                        )}
                    </ListData>
                </View.Body>
            </View.List>
        );
    }
}

export default createComponent(View, { modules: [] });

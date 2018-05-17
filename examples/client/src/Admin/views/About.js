import React, { Fragment } from "react";
import { createComponent, i18n } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

const t = i18n.namespace("NewClient.Frontend.Views.About");

class About extends React.Component {
    constructor() {
        super();

        this.state = { searchQuery: "" };
    }

    renderFilters() {
        const { Grid, List, OptionsData, Input, Select, Search } = this.props.modules;

        return (
            <List.FormFilters>
                {({ apply, Bind }) => (
                    <Grid.Row>
                        <Grid.Col all={4}>
                            <Bind afterChange={apply()}>
                                <Select
                                    name="enabled"
                                    placeholder={t`All users`}
                                    allowClear
                                    options={[
                                        { value: true, label: t`Enabled` },
                                        { value: false, label: t`Disabled` }
                                    ]}
                                />
                            </Bind>
                        </Grid.Col>
                        <Grid.Col all={4}>
                            <Bind>
                                <Input
                                    name="search.query"
                                    placeholder={t`Search by email`}
                                    onEnter={apply()}
                                />
                            </Bind>
                        </Grid.Col>
                        <Grid.Col all={4}>
                            <OptionsData
                                entity={"SecurityUser"}
                                fields={"id email"}
                                labelField={"email"}
                                perPage={10}
                                searchOnly
                                search={{ fields: ["email"], query: this.state.searchQuery }}
                            >
                                {({ options, loadById }) => (
                                    <Bind afterChange={apply()}>
                                        <Search
                                            resolveSelected={loadById}
                                            onSearch={query =>
                                                this.setState({ searchQuery: query })
                                            }
                                            options={options}
                                            name="createdBy"
                                            placeholder={t`Search by creator`}
                                            renderOptionLabel={({ option }) => (
                                                <span>
                                                    <strong>{option.label}</strong>
                                                    <br />
                                                    {option.id}
                                                </span>
                                            )}
                                        />
                                    </Bind>
                                )}
                            </OptionsData>
                        </Grid.Col>
                    </Grid.Row>
                )}
            </List.FormFilters>
        );
    }

    render() {
        const {
            List,
            ListData,
            AdminLayout,
            View,
            Link,
            Icon,
            Dropdown,
            Modal,
            Button,
            Input,
            Select,
            Grid,
            Loader,
            Search
        } = this.props.modules;

        return (
            <AdminLayout>
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
                            entity={"SecurityUser"}
                            sort={{ email: -1 }}
                            fields={"id firstName email createdOn enabled"}
                            search={{ fields: ["email", "firstName"] }}
                        >
                            {({ loading, ...listProps }) => (
                                <Fragment>
                                    {loading && <Loader />}
                                    <List {...listProps}>
                                        <List.Table>
                                            <List.Table.Row>
                                                <List.Table.Field
                                                    name="email"
                                                    align="left"
                                                    label={t`Title`}
                                                    sort="email"
                                                    route={"Profile"}
                                                >
                                                    {({ data }) => (
                                                        <span>
                                                            <strong>{data.email}</strong>
                                                            <br />
                                                            {t`{created|dateTime}`({
                                                                created: data.createdOn
                                                            })}
                                                        </span>
                                                    )}
                                                </List.Table.Field>
                                                <List.Table.ToggleField
                                                    name="enabled"
                                                    sort="enabled"
                                                    align="center"
                                                    label={t`Published`}
                                                />
                                                <List.Table.DateTimeField
                                                    name="createdOn"
                                                    align="left"
                                                    label={t`Created`}
                                                    sort="createdOn"
                                                />
                                                <List.Table.Actions>
                                                    <List.Table.EditAction route="Profile" />
                                                    <List.Table.DeleteAction />
                                                </List.Table.Actions>
                                            </List.Table.Row>
                                        </List.Table>
                                        <List.Pagination />
                                        <List.MultiActions>
                                            <List.MultiAction
                                                label={t`Log`}
                                                onAction={({ data }) => console.log(data)}
                                            />

                                            <Dropdown.Divider />
                                            <List.DeleteMultiAction
                                                onConfirm={this.delete}
                                                message={({ data }) =>
                                                    t`Delete {records|count:1:record:default:records}?`(
                                                        {
                                                            records: data.length
                                                        }
                                                    )
                                                }
                                            />
                                            <List.ModalMultiAction label={"Modal"}>
                                                {({ data, dialog }) => (
                                                    <ModalComponent name={"export-summary"}>
                                                        <Modal.Dialog>
                                                            <Modal.Content>
                                                                <Modal.Header
                                                                    title={"Export summary"}
                                                                />
                                                                <Modal.Body>
                                                                    {JSON.stringify(
                                                                        Array.from(data)
                                                                    )}
                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    <Button
                                                                        type="default"
                                                                        label={t`Cancel`}
                                                                        onClick={dialog.hide}
                                                                    />
                                                                </Modal.Footer>
                                                            </Modal.Content>
                                                        </Modal.Dialog>
                                                    </ModalComponent>
                                                )}
                                            </List.ModalMultiAction>
                                        </List.MultiActions>
                                    </List>
                                </Fragment>
                            )}
                        </ListData>
                    </View.Body>
                </View.List>
            </AdminLayout>
        );
    }
}

export default createComponent(About, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "List",
        "ListData",
        "OptionsData",
        "View",
        "Link",
        "Icon",
        "Input",
        "Select",
        "Loader",
        "Dropdown",
        "Grid",
        "Modal",
        "Button",
        "Search"
    ]
});

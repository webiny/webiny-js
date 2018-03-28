import React from "react";
import { createComponent, i18n } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

const t = i18n.namespace("NewClient.Frontend.Views.About");

class About extends React.Component {
    render() {
        const {
            List,
            AdminLayout,
            View,
            Link,
            Icon,
            Dropdown,
            Modal,
            Button,
            Input,
            Select,
            Grid
        } = this.props;

        return (
            <AdminLayout>
                <View.List>
                    <View.Header
                        title={t`My List`}
                        description={t`Your list of records. Click the button on the right to create a new record.`}
                    >
                        <Link type="primary" align="right">
                            <Icon icon="icon-plus-circled" />
                            {t`New record`}
                        </Link>
                    </View.Header>
                    <View.Body>
                        <List
                            api="/security/users"
                            connectToRouter={true}
                            sort="email"
                            fields={"id,firstName,email,createdOn,enabled"}
                            searchFields="email,firstName"
                        >
                            <List.FormFilters>
                                {({ apply }) => (
                                    <Grid.Row>
                                        <Grid.Col all={6}>
                                            <Select
                                                name="enabled"
                                                placeholder={t`All users`}
                                                onChange={apply()}
                                                allowClear
                                            >
                                                <option value={true}>{t`Enabled`}</option>
                                                <option value={false}>{t`Disabled`}</option>
                                            </Select>
                                        </Grid.Col>
                                        <Grid.Col all={6}>
                                            <Input
                                                name="_searchQuery"
                                                placeholder={t`Search by email`}
                                                onEnter={apply()}
                                            />
                                        </Grid.Col>
                                    </Grid.Row>
                                )}
                            </List.FormFilters>
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
                                                {t`{created|dateTime}`({ created: data.createdOn })}
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

                                <List.MultiAction
                                    label={t`Export ZIP`}
                                    download={({ download, data }) => {
                                        download("POST", "/security/users", {
                                            ids: _.map(Array.from(data), "id")
                                        });
                                    }}
                                />

                                <Dropdown.Divider />
                                <List.DeleteMultiAction
                                    onConfirm={this.delete}
                                    message={({ data }) =>
                                        t`Delete {records|count:1:record:default:records}?`({
                                            records: data.length
                                        })
                                    }
                                />
                                <List.ModalMultiAction label={"Modal"}>
                                    {({ data, dialog }) => (
                                        <ModalComponent name={"export-summary"}>
                                            <Modal.Dialog>
                                                <Modal.Content>
                                                    <Modal.Header title={"Export summary"} />
                                                    <Modal.Body>
                                                        {JSON.stringify(Array.from(data))}
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
                    </View.Body>
                </View.List>
            </AdminLayout>
        );
    }
}

export default createComponent(About, {
    modules: [
        { AdminLayout: "Skeleton.AdminLayout" },
        "List",
        "View",
        "Link",
        "Icon",
        "Input",
        "Select",
        "Dropdown",
        "Grid",
        "Modal",
        "Button"
    ]
});

import React from "react";
import { app, createComponent, i18n } from "webiny-app";
import { GraphQLFormData, GraphQLOptionsData } from "webiny-data-ui";
import CustomDialog from "./CustomDialog";

const t = i18n.namespace("NewClient.Frontend.Views.Profile");

class Profile extends React.Component {
    constructor() {
        super();

        this.state = {
            searchQuery: null
        };
    }
    showDialog(name) {
        return () => app.services.get("modal").show(name);
    }

    renderDynamicFieldset(Bind) {
        const { Dynamic, Grid, Input, Button, ButtonGroup } = this.props.modules;

        return (
            <Bind>
                <Dynamic.Fieldset name="contacts">
                    <Dynamic.Header>
                        {() => (
                            <Grid.Row>
                                <Grid.Col all={3}>
                                    <h5>{t`Key`}</h5>
                                </Grid.Col>
                                <Grid.Col all={3}>
                                    <h5>{t`Value`}</h5>
                                </Grid.Col>
                            </Grid.Row>
                        )}
                    </Dynamic.Header>
                    <Dynamic.Row>
                        {({ data, actions }) => (
                            <Grid.Row>
                                <Grid.Col all={3}>
                                    <Input placeholder="Key" name="key" validators="required" />
                                </Grid.Col>
                                <Grid.Col all={3}>
                                    <Input placeholder="Value" name="value" validators="required" />
                                </Grid.Col>
                                <Grid.Col all={6}>
                                    <ButtonGroup>
                                        <Button
                                            type="primary"
                                            label="Add"
                                            onClick={actions.add(data)}
                                        />
                                        <Button
                                            type="secondary"
                                            label="x"
                                            onClick={actions.remove(data)}
                                        />
                                    </ButtonGroup>
                                </Grid.Col>
                            </Grid.Row>
                        )}
                    </Dynamic.Row>
                    <Dynamic.Empty>
                        {({ actions }) => (
                            <Grid.Row>
                                <Grid.Col all={12}>
                                    <h6>
                                        {t`You have not added any contacts yet. Click "Add contact" to start creating your contacts!`}
                                    </h6>
                                    <Button
                                        type="primary"
                                        label={t`Add contact`}
                                        onClick={actions.add()}
                                    />
                                </Grid.Col>
                            </Grid.Row>
                        )}
                    </Dynamic.Empty>
                </Dynamic.Fieldset>
            </Bind>
        );
    }

    render() {
        const {
            AdminLayout,
            Form,
            View,
            Grid,
            Avatar,
            Section,
            Input,
            Button,
            Password,
            Switch,
            Modal,
            ClickConfirm,
            ClickSuccess,
            ChangeConfirm,
            CheckboxGroup,
            Gallery,
            File,
            RadioGroup,
            Select,
            Search,
            IconPicker,
            Tabs,
            Tags,
            Tile,
            ViewSwitcher
        } = this.props.modules;

        const msg = data => (
            <span>
                Your purchase is now completed!<br />
                Transaction status: <strong>{data.status}</strong>
                <br />
                Thank you for shopping with us!
            </span>
        );

        const selectProps = {
            label: "Select assignee",
            placeholder: "Select a value",
            name: "assignee"
        };

        const searchProps = {
            label: "Search manager",
            name: "manager",
            renderOptionLabel: ({ option }) => (
                <div>
                    <strong>{option.data.email}</strong>
                    <br />
                    <span>
                        {t`Created on: {created|dateTime}`({ created: option.data.createdOn })}
                    </span>
                </div>
            )
        };

        const radioGroup = {
            label: t`Select assignee`,
            name: "assignee",
            renderRadioLabel() {
                const { option } = this.props;
                return (
                    <span>
                        <strong>{option.data.email}</strong>
                        <br />
                        {option.data.id}
                    </span>
                );
            },
            renderRadio() {
                // `this` is bound to Radio component instance
                let style = {
                    border: "1px solid #666",
                    padding: 5,
                    marginBottom: 2
                };
                if (this.props.value) {
                    style.color = "white";
                    style.backgroundColor = "#FA5723";
                    style.fontWeight = "bold";
                }
                return (
                    <div style={style} onClick={this.onChange}>
                        {this.props.renderLabel.call(this)}
                    </div>
                );
            }
        };

        return (
            <AdminLayout>
                <GraphQLFormData
                    entity="SecurityUser"
                    withRouter
                    fields={"id firstName lastName email enabled"}
                    onSubmitSuccess="About"
                >
                    {({ model, onSubmit, invalidFields }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ model, form, Bind }) => (
                                <View.Form>
                                    <View.Header
                                        title={model.id ? t`ACL - Edit User` : t`ACL - Create User`}
                                    >
                                        <Button
                                            type="primary"
                                            label={t`Show modal`}
                                            onClick={this.showDialog("myDialog")}
                                        />
                                        <Button
                                            type="primary"
                                            label={t`Confirm modal`}
                                            onClick={this.showDialog("confirmAction")}
                                        />
                                        <Button
                                            type="primary"
                                            label={t`Success modal`}
                                            onClick={this.showDialog("successAction")}
                                        />
                                        <ClickSuccess message="That was easy!">
                                            <Button
                                                type="primary"
                                                label={t`Click me!`}
                                                onClick={() => {}}
                                            />
                                        </ClickSuccess>
                                        <CustomDialog name={"myDialog"} />
                                        <Modal.Confirmation
                                            name={"confirmAction"}
                                            message={"Are you sure?"}
                                        />
                                        <Modal.Success
                                            name={"successAction"}
                                            message={t`Hoorraaaay!`}
                                        />
                                        <ClickSuccess message={msg}>
                                            {({ success }) => (
                                                <ClickConfirm
                                                    message="This will charge your card with $15.99. Proceed?"
                                                    onComplete={success}
                                                >
                                                    {({ showConfirmation }) => (
                                                        <Button
                                                            type="primary"
                                                            label="Charge my credit card"
                                                            onClick={() =>
                                                                showConfirmation(() => {
                                                                    return new Promise(r =>
                                                                        setTimeout(() => {
                                                                            r({
                                                                                status: "processing"
                                                                            });
                                                                        }, 1500)
                                                                    );
                                                                })
                                                            }
                                                        />
                                                    )}
                                                </ClickConfirm>
                                            )}
                                        </ClickSuccess>
                                    </View.Header>
                                    <View.Body noPadding>
                                        <pre>{JSON.stringify(model, null, 2)}</pre>
                                        <Tabs size="large">
                                            <Tabs.Tab label="User" icon="home">
                                                <Grid.Row>
                                                    <Grid.Col all={6}>
                                                        <Section title={t`Info`} />
                                                        <Grid.Row>
                                                            <Grid.Col all={8}>
                                                                <Bind>
                                                                    <Input
                                                                        label={t`First name`}
                                                                        name="firstName"
                                                                        validators="required"
                                                                    />
                                                                </Bind>
                                                                <Bind>
                                                                    <Input
                                                                        label={t`Last name`}
                                                                        name="lastName"
                                                                        validators="required"
                                                                    />
                                                                </Bind>
                                                                <Bind>
                                                                    <Input
                                                                        label={t`Email`}
                                                                        name="email"
                                                                        description={t`Your email`}
                                                                        validators="email"
                                                                    />
                                                                </Bind>
                                                                <Bind>
                                                                    <Tags
                                                                        name={"tags"}
                                                                        label={t`User tags`}
                                                                        validatorsTags={
                                                                            "minLength:3"
                                                                        }
                                                                    />
                                                                </Bind>
                                                                <ChangeConfirm message="Are you sure you want to toggle this switch?">
                                                                    {({ showConfirmation }) => (
                                                                        <Bind
                                                                            beforeChange={
                                                                                showConfirmation
                                                                            }
                                                                        >
                                                                            <Switch
                                                                                label={t`Enabled`}
                                                                                name="enabled"
                                                                            />
                                                                        </Bind>
                                                                    )}
                                                                </ChangeConfirm>
                                                            </Grid.Col>
                                                            <Grid.Col all={4}>
                                                                <Bind>
                                                                    <Avatar
                                                                        cropper={{
                                                                            title: t`Crop your image`,
                                                                            action: t`Upload image`,
                                                                            config: {
                                                                                aspectRatio: 1,
                                                                                closeOnClick: false,
                                                                                autoCropArea: 0.7,
                                                                                width: 300,
                                                                                height: 300
                                                                            }
                                                                        }}
                                                                        name="avatar"
                                                                        empty="x"
                                                                    />
                                                                </Bind>
                                                            </Grid.Col>
                                                        </Grid.Row>
                                                    </Grid.Col>
                                                    <Grid.Col all={6}>
                                                        <Section title={t`Password`} />
                                                        <Grid.Row>
                                                            <Grid.Col all={12}>
                                                                <Bind>
                                                                    <Password
                                                                        label={t`New password`}
                                                                        name="password"
                                                                        placeholder={t`Type a new password`}
                                                                    />
                                                                </Bind>
                                                            </Grid.Col>
                                                        </Grid.Row>
                                                        <Grid.Row>
                                                            <Grid.Col all={12}>
                                                                <Bind>
                                                                    <Password
                                                                        label={t`Confirm password`}
                                                                        name="confirmPassword"
                                                                        validators="eq:@password"
                                                                        placeholder={t`Retype the new password`}
                                                                    >
                                                                        <validator name="eq">
                                                                            {t`Passwords do not match`}
                                                                        </validator>
                                                                    </Password>
                                                                </Bind>
                                                            </Grid.Col>
                                                        </Grid.Row>
                                                        <Grid.Row>
                                                            <Grid.Col all={12}>
                                                                <Bind>
                                                                    <Gallery name={"gallery"} />
                                                                </Bind>
                                                            </Grid.Col>
                                                        </Grid.Row>
                                                    </Grid.Col>
                                                </Grid.Row>
                                            </Tabs.Tab>
                                            <Tabs.Tab label="Tab 2" icon="cog">
                                                <Grid.Row>
                                                    <Grid.Col all={6}>
                                                        <Section title={t`Info`} />
                                                        <GraphQLOptionsData
                                                            entity={"SecurityUser"}
                                                            fields={"id email"}
                                                            sort={{ email: 1 }}
                                                            perPage={5}
                                                            labelField={"email"}
                                                            filter={{ enabled: model.enabled }}
                                                        >
                                                            {({ options }) => (
                                                                <Bind>
                                                                    <CheckboxGroup
                                                                        options={options}
                                                                        name={"owners"}
                                                                        label={"Select owners"}
                                                                    >
                                                                        <validator name="required">
                                                                            {t`You must select something!`}
                                                                        </validator>
                                                                        <validator name="minLength">
                                                                            {t`Select at least 2 items`}
                                                                        </validator>
                                                                    </CheckboxGroup>
                                                                </Bind>
                                                            )}
                                                        </GraphQLOptionsData>
                                                        <GraphQLOptionsData
                                                            entity={"SecurityUser"}
                                                            fields={"id email"}
                                                            sort={{ email: 1 }}
                                                            perPage={5}
                                                            labelField={"email"}
                                                            filter={{ enabled: model.enabled }}
                                                        >
                                                            {({ options }) => (
                                                                <Bind>
                                                                    <RadioGroup
                                                                        useDataAsValue
                                                                        options={options}
                                                                        {...radioGroup}
                                                                    />
                                                                </Bind>
                                                            )}
                                                        </GraphQLOptionsData>
                                                        <Bind>
                                                            <File
                                                                label={t`Verification document`}
                                                                placeholder={t`Select a file`}
                                                                name="document"
                                                            />
                                                        </Bind>
                                                        <Bind>
                                                            <IconPicker
                                                                label={t`Icon`}
                                                                placeholder={t`Select an icon`}
                                                                name={"icon"}
                                                            />
                                                        </Bind>
                                                        <GraphQLOptionsData
                                                            entity="SecurityUser"
                                                            fields="id email"
                                                            sort={{ email: 1 }}
                                                            perPage={20}
                                                            labelField="email"
                                                            filter={{ enabled: model.enabled }}
                                                        >
                                                            {({ options }) => (
                                                                <Bind>
                                                                    <Select
                                                                        {...selectProps}
                                                                        useDataAsValue
                                                                        options={options}
                                                                    />
                                                                </Bind>
                                                            )}
                                                        </GraphQLOptionsData>
                                                        <GraphQLOptionsData
                                                            entity="SecurityUser"
                                                            fields="id email createdOn"
                                                            sort={{ email: -1 }}
                                                            perPage={10}
                                                            labelField="email"
                                                            searchOnly
                                                            search={{
                                                                fields: ["email"],
                                                                query: this.state.searchQuery
                                                            }}
                                                            filter={{ enabled: model.enabled }}
                                                        >
                                                            {({ options }) => (
                                                                <Bind>
                                                                    <Search
                                                                        onSearch={searchQuery =>
                                                                            this.setState({
                                                                                searchQuery
                                                                            })
                                                                        }
                                                                        {...searchProps}
                                                                        options={options}
                                                                    />
                                                                </Bind>
                                                            )}
                                                        </GraphQLOptionsData>
                                                    </Grid.Col>
                                                </Grid.Row>
                                            </Tabs.Tab>
                                            <Tabs.Tab
                                                label="Tab 3"
                                                icon={["fas", "money-bill-alt"]}
                                            >
                                                <Grid.Row>
                                                    <Grid.Col all={12}>
                                                        <ViewSwitcher>
                                                            <ViewSwitcher.View
                                                                name="view1"
                                                                defaultView
                                                            >
                                                                {({ showView }) => (
                                                                    <div>
                                                                        <p>
                                                                            Hey, this is{" "}
                                                                            <strong>view1!</strong>
                                                                        </p>
                                                                        <Button
                                                                            label={t`Show View 2`}
                                                                            onClick={showView(
                                                                                "view2"
                                                                            )}
                                                                        />
                                                                        <Button
                                                                            label={t`Show Modal View`}
                                                                            onClick={showView(
                                                                                "view3"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </ViewSwitcher.View>

                                                            <ViewSwitcher.View name="view2">
                                                                {({ showView }) => (
                                                                    <div>
                                                                        <p>
                                                                            You made it to{" "}
                                                                            <strong>view2</strong>.
                                                                        </p>
                                                                        <Button
                                                                            label={t`Show View 1`}
                                                                            onClick={showView(
                                                                                "view1"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </ViewSwitcher.View>

                                                            <ViewSwitcher.View name="view3" modal>
                                                                {() => (
                                                                    <CustomDialog
                                                                        name={
                                                                            "view-switcher-dialog"
                                                                        }
                                                                    />
                                                                )}
                                                            </ViewSwitcher.View>
                                                        </ViewSwitcher>
                                                        {this.renderDynamicFieldset(Bind)}
                                                    </Grid.Col>
                                                </Grid.Row>
                                            </Tabs.Tab>
                                        </Tabs>
                                    </View.Body>
                                    <View.Footer>
                                        <Button
                                            type="default"
                                            onClick={() => app.router.goToRoute("About")}
                                            label={t`Go back`}
                                        />
                                        <Button
                                            type="primary"
                                            onClick={form.submit}
                                            label={t`Save user`}
                                            align="right"
                                        />
                                    </View.Footer>
                                </View.Form>
                            )}
                        </Form>
                    )}
                </GraphQLFormData>
            </AdminLayout>
        );
    }
}

export default createComponent(Profile, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "Form",
        "View",
        "Grid",
        "Section",
        "Input",
        "Button",
        "Password",
        "Switch",
        "Modal",
        "ClickSuccess",
        "ClickConfirm",
        "ChangeConfirm",
        "CheckboxGroup",
        "Avatar",
        "Dynamic",
        "ButtonGroup",
        "File",
        "Gallery",
        "RadioGroup",
        "Select",
        "Search",
        "IconPicker",
        "Tabs",
        "Tags",
        "Tile",
        "ViewSwitcher"
    ]
});

import React from "react";
import { createComponent } from "webiny-app";
import { FormData, FormError, OptionsData } from "webiny-graphql-ui";

class View extends React.Component {
    render() {
        const {
            Form,
            Input,
            Button,
            Checkbox,
            CheckboxGroup,
            Loader,
            Grid,
            View,
            Switch,
            ChangeConfirm,
            ClickConfirm,
            ClickSuccess
        } = this.props.modules;

        const msg = data => (
            <span>
                Your purchase is now completed!<br />
                Transaction status: <strong>{data.status}</strong>
                <br />
                Thank you for shopping with us!
            </span>
        );

        return (
            <FormData
                entity="SecurityUser"
                withRouter
                fields={"id firstName lastName email enabled"}
            >
                {({ model, onSubmit, error, loading, invalidFields }) => (
                    <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                        {({ model, Bind }) => (
                            <View.Form>
                                <View.Header title={"New form implementation"} />
                                {error && (
                                    <View.Error>
                                        <FormError error={error} />
                                    </View.Error>
                                )}
                                <View.Body>
                                    {loading && <Loader />}
                                    <Grid.Row>
                                        <Grid.Col all={6}>
                                            <Bind>
                                                <Input
                                                    label={`First name`}
                                                    name="firstName"
                                                    validators="required"
                                                />
                                            </Bind>
                                            <Bind>
                                                <Input
                                                    label={`Last name`}
                                                    name="lastName"
                                                    validators="required"
                                                />
                                            </Bind>
                                            <Bind>
                                                <Input
                                                    label={`Email`}
                                                    name="email"
                                                    description={`Your email`}
                                                    validators="email"
                                                />
                                            </Bind>
                                            <OptionsData
                                                entity={"SecurityUsers"}
                                                fields={"id email"}
                                                textAttr={"email"}
                                                perPage={5}
                                                filter={{ enabled: model.enabled }}
                                            >
                                                {({ options }) => (
                                                    <Bind>
                                                        <CheckboxGroup
                                                            disabled={model.enabled}
                                                            options={options}
                                                            name={"users"}
                                                            label={"Select a few users"}
                                                        />
                                                    </Bind>
                                                )}
                                            </OptionsData>
                                            <ChangeConfirm message="Are you sure you want to toggle this switch?">
                                                {({ showConfirmation }) => (
                                                    <Bind beforeChange={showConfirmation}>
                                                        <Switch label={`Enabled`} name="enabled" />
                                                    </Bind>
                                                )}
                                            </ChangeConfirm>
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
                                                                    showConfirmation(
                                                                        () =>
                                                                            new Promise(r =>
                                                                                setTimeout(() => {
                                                                                    r({
                                                                                        status:
                                                                                            "processing"
                                                                                    });
                                                                                }, 1500)
                                                                            )
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </ClickConfirm>
                                                )}
                                            </ClickSuccess>
                                        </Grid.Col>
                                        <Grid.Col all={6}>
                                            <pre>{JSON.stringify(model, null, 2)}</pre>
                                        </Grid.Col>
                                    </Grid.Row>
                                </View.Body>
                            </View.Form>
                        )}
                    </Form>
                )}
            </FormData>
        );
    }
}

export default createComponent(View, {
    modules: [
        "Grid",
        "Form",
        "Input",
        "View",
        "Checkbox",
        "Switch",
        "ChangeConfirm",
        "Loader",
        "Button",
        "ClickSuccess",
        "ClickConfirm",
        "CheckboxGroup"
    ]
});

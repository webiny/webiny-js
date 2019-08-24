// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import MenuItems from "./MenusForm/MenuItems";
import type { WithCrudFormProps } from "webiny-app-admin/components";
import { CircularProgress } from "webiny-ui/Progress";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/SimpleForm";

type Props = WithCrudFormProps;
type State = {
    item: ?Object
};

class MenusForm extends React.Component<Props, State> {
    render() {
        const { data, invalidFields, onSubmit, loading } = this.props;

        // TODO: onSubmit - remove attributes added by the Tree plugin

        return (
            <Form data={data || { items: [] }} invalidFields={invalidFields} onSubmit={onSubmit}>
                {({ data, form, Bind }) => (
                    <SimpleForm>
                        {loading && <CircularProgress />}
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={6}>
                                    <Bind name="title" validators={["required"]}>
                                        <Input label={"Name"} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={["required"]}>
                                        <Input disabled={data.id} label={"Slug"} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="description">
                                        <Input rows={5} label={"Description"} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Bind name="items">
                                {props => <MenuItems menuForm={form} {...props} />}
                            </Bind>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary type="primary" onClick={form.submit} align="right">
                                {"Save menu"}
                            </ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        );
    }
}

export default MenusForm;

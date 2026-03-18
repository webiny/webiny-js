import React from "react";
import { Grid, Input } from "webiny/admin/ui";
import { pagePathFromTitle } from "webiny/admin/website-builder";
import type { FormApi } from "webiny/admin/form";
import { Bind, UnsetOnUnmount, useForm } from "webiny/admin/form";
import { required } from "../utils/validators";

const generatePath = (form: FormApi) => () => {
    const title = form.getValue("properties.title");

    const titlePath = pagePathFromTitle(title ?? "");

    form.setValue("properties.path", `/funnel/${titlePath}`);
};

export const FunnelPageForm = () => {
    const form = useForm();

    return (
        <>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.title"}>
                    <Bind name={"properties.title"} validators={required}>
                        <Input label={"Title"} onBlur={generatePath(form)} />
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.path"}>
                    <Bind name={"properties.path"} validators={required}>
                        <Input label={"Path"} />
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
        </>
    );
};

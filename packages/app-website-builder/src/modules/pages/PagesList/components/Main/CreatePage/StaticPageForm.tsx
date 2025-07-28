import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { FormAPI, UnsetOnUnmount, useBind, useForm } from "@webiny/form";
import { validation } from "@webiny/validation";
import { pagePathFromTitle } from "~/shared/pagePathFromTitle";

const generatePath = (form: FormAPI) => () => {
    if (form.data.path) {
        return;
    }
    const titlePath = pagePathFromTitle(form.data.title) ?? "";
    form.setValue("path", `/${titlePath}`);
};

export const StaticPageForm = () => {
    const form = useForm();
    const titleBind = useBind({
        name: "title",
        validators: [validation.create("required")]
    });
    const pathBind = useBind({ name: "path", validators: [validation.create("required")] });

    return (
        <>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.title"}>
                    <Input label={"Title"} {...titleBind} onBlur={generatePath(form)} />
                </UnsetOnUnmount>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.path"}>
                    <Input label={"Path"} {...pathBind} />
                </UnsetOnUnmount>
            </Grid.Column>
        </>
    );
};

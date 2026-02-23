import React from "react";
import { Grid, Input, Select } from "webiny/admin/ui";
import { pagePathFromTitle } from "webiny/admin/website-builder";
import type { FormApi } from "webiny/admin/form";
import { Bind, UnsetOnUnmount, useForm, validation } from "webiny/admin/form";

const generatePath = (form: FormApi) => () => {
    const title = form.getValue("properties.title");
    const language = form.getValue("extensions.language");

    const titlePath = pagePathFromTitle(title ?? "");
    const parts = [language, titlePath].filter(Boolean);

    form.setValue("properties.path", `/${parts.join("/")}`);
};

export const RetailPageForm = () => {
    const form = useForm();

    return (
        <>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.title"}>
                    <Bind name={"properties.title"} validators={[validation.create("required")]}>
                        <Input label={"Title"} onBlur={generatePath(form)} />
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"extensions.language"}>
                    <Bind
                        name={"extensions.language"}
                        validators={[validation.create("required")]}
                        afterChange={generatePath(form)}
                    >
                        <Select
                            placeholder={"Select a language"}
                            label={"Language"}
                            options={[
                                { label: "English", value: "en" },
                                { label: "German", value: "de" },
                                { label: "French", value: "fr" }
                            ]}
                        />
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.path"}>
                    <Bind name={"properties.path"} validators={[validation.create("required")]}>
                        <Input label={"Path"} />
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
        </>
    );
};

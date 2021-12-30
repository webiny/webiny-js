import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { usePbWebsiteSettings } from "./usePbWebsiteSettings";

export const SettingsFields = makeComposable("SettingsFields", () => null);

export const WebsiteSettingsView = () => {
    const { fetching, saving, settings, saveSettings } = usePbWebsiteSettings();

    return (
        <Grid>
            <Cell span={3} tablet={0} />
            <Cell span={6} tablet={12}>
                <Form data={settings} onSubmit={saveSettings}>
                    {({ submit }) => (
                        <SimpleForm>
                            {fetching && <CircularProgress label={"Loading settings..."} />}
                            {saving && <CircularProgress label={"Saving settings..."} />}
                            <SettingsFields />
                            <SimpleFormFooter>
                                <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                            </SimpleFormFooter>
                        </SimpleForm>
                    )}
                </Form>
            </Cell>
        </Grid>
    );
};

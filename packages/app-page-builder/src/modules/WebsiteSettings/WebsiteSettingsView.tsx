import React from "react";
import { CenteredView, createVoidComponent, makeDecoratable } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SimpleForm, SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { usePbWebsiteSettings } from "./usePbWebsiteSettings";

export const SettingsFields = makeDecoratable("SettingsFields", createVoidComponent());

export const WebsiteSettingsView = () => {
    const { fetching, saving, settings, saveSettings } = usePbWebsiteSettings();

    return (
        <CenteredView>
            <Form data={settings} onSubmit={saveSettings}>
                {({ submit }) => (
                    <SimpleForm>
                        {fetching && <CircularProgress label={"Loading settings..."} />}
                        {saving && <CircularProgress label={"Saving settings..."} />}
                        <SettingsFields />
                        <SimpleFormFooter>
                            <ButtonPrimary
                                onClick={ev => {
                                    submit(ev);
                                }}
                            >
                                Save
                            </ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        </CenteredView>
    );
};

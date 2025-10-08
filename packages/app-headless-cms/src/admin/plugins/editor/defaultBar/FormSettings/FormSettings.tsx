import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
import {
    LeftPanel,
    OverlayLayout,
    RightPanel,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    SplitView,
    useSnackbar
} from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsEditorFormSettingsPlugin } from "~/types.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { Button, Heading, Icon, List } from "@webiny/admin-ui";

const t = i18n.namespace("FormsApp.Editor.FormSettings");

const Title = () => {
    return (
        <Heading
            level={5}
            className={"wby-text-neutral-strong"}
        >{t`Content model settings`}</Heading>
    );
};

interface FormSettingsProps {
    onExited: () => void;
}

const FormSettings = ({ onExited }: FormSettingsProps) => {
    const cmsEditorFormSettingsPlugins = plugins.byType<CmsEditorFormSettingsPlugin>(
        "cms-editor-form-settings"
    );
    const { data, setData } = useModelEditor();
    const { showSnackbar } = useSnackbar();

    const [activePlugin, setActivePlugin] = useState(cmsEditorFormSettingsPlugins[0]);

    return (
        <OverlayLayout barMiddle={<Title />} onExited={onExited}>
            <SplitView>
                <LeftPanel span={5}>
                    <List>
                        {cmsEditorFormSettingsPlugins.map(pl => (
                            <List.Item
                                key={pl.name}
                                onClick={() => setActivePlugin(pl)}
                                icon={<Icon label={pl.title} icon={pl.icon} />}
                                title={pl.title}
                                description={pl.description}
                            />
                        ))}
                    </List>
                </LeftPanel>
                <RightPanel span={7}>
                    <Form
                        data={data}
                        onSubmit={data => {
                            setData(() => data);
                            onExited();
                            showSnackbar(t`Content model settings updated successfully.`);
                        }}
                    >
                        {({ Bind, submit, form, data: formData }) => (
                            <SimpleForm size={"lg"}>
                                <SimpleFormHeader title={activePlugin.title}>
                                    <div className={"wby-flex wby-justify-end wby-items-center"}>
                                        {typeof activePlugin.renderHeaderActions === "function" &&
                                            activePlugin.renderHeaderActions({
                                                Bind,
                                                form,
                                                formData
                                            })}
                                    </div>
                                </SimpleFormHeader>
                                <SimpleFormContent>
                                    {activePlugin
                                        ? activePlugin.render({
                                              Bind: Bind,
                                              form,
                                              formData
                                          })
                                        : null}
                                </SimpleFormContent>
                                {activePlugin?.showSave !== false ? (
                                    <SimpleFormFooter>
                                        <Button
                                            text={t`Save`}
                                            onClick={ev => {
                                                submit(ev);
                                            }}
                                        />
                                    </SimpleFormFooter>
                                ) : null}
                            </SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default FormSettings;

import React, {useContext} from "react";
import styled from "react-emotion";
import { Switch } from "webiny-ui/Switch";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/SimpleForm";
import { Typography } from "webiny-ui/Typography";
import { RichTextEditor } from "webiny-app-forms/admin/components/RichTextEditor";
import { FormEditorContext } from "webiny-app-forms/admin/components/FormEditor";
import { ReactComponent as TextIcon } from "../icons/round-text_format-24px.svg";
import { ReactComponent as LinkIcon } from "../icons/round-link-24px.svg";
import { ReactComponent as CodeIcon } from "../icons/round-code-24px.svg";

const Container = styled("div")({
    padding: "40px 60px"
});

export const TriggersTab = () => {
    const { validators, createBind, createToggle, createSetValue } = useValidatorsTab(props);

    return (
        <Container>
            {validators.map(({ optional, validator: v }) => {
                const vIndex = props.value.findIndex(x => x.id === v.id);
                const enabled = vIndex > -1;
                const hasSettings = typeof v.renderSettings === "function";
                const Bind = createBind(v.id, vIndex);
                const setValue = createSetValue(v.id, vIndex);
                const data = props.value[vIndex];

                return (
                    <SimpleForm key={v.id}>
                        <SimpleFormHeader title={v.label} description={v.description}>
                            {optional && (
                                <Switch
                                    label="Enabled"
                                    value={enabled}
                                    onChange={createToggle(v.id, enabled)}
                                />
                            )}
                        </SimpleFormHeader>
                        {enabled && hasSettings && (
                            <SimpleFormContent>
                                {v.renderSettings({ data, setValue, Bind })}
                            </SimpleFormContent>
                        )}
                    </SimpleForm>
                );
            })}
        </Container>
    );
};

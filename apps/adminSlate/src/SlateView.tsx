import React from "react";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
import { RichTextEditor } from "@webiny/app-i18n/admin/components/RichTextEditor/RichTextEditor";
import { getPlugins } from "@webiny/plugins";
import { I18NInputRichTextEditorPlugin } from "@webiny/app-i18n/types";

const initialValue = [
    {
        type: "paragraph",
        children: [
            {
                text: "A wrapper around the provider "
            },
            {
                type: "link",
                href: "https://docs.slatejs.org/libraries/slate-react",
                children: [
                    {
                        text: "to handle onChange"
                    }
                ]
            },
            {
                text:
                    ' events, because the editor is a mutable singleton so it won\'t ever register as "changed" otherwise.'
            }
        ]
    }
];

const SlateView = () => {
    const plugins = React.useMemo(
        () =>
            getPlugins("i18n-input-rich-text-editor").map(
                (plugin: I18NInputRichTextEditorPlugin) => plugin.plugin
            ),
        []
    );

    return (
        <Grid>
            <Cell span={2} />
            <Cell span={8}>
                <Form
                    data={{ richText: initialValue }}
                    onSubmit={data => console.log(JSON.stringify(data.richText, null, 2))}
                >
                    {({ form, Bind }) => (
                        <SimpleForm>
                            <SimpleFormHeader title={"Slate Editor"} />
                            <SimpleFormContent>
                                <Bind name={"richText"}>
                                    <RichTextEditor
                                        plugins={plugins}
                                        placeholder={"Enter some text..."}
                                    />
                                </Bind>
                            </SimpleFormContent>
                            <SimpleFormFooter>
                                <ButtonPrimary onClick={form.submit}>Save</ButtonPrimary>
                            </SimpleFormFooter>
                        </SimpleForm>
                    )}
                </Form>
            </Cell>
        </Grid>
    );
};

export default SlateView;

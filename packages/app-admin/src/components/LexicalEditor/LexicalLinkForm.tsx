import React from "react";
import type { FloatingLinkEditorPlugin } from "@webiny/lexical-editor";
import { Button, Grid, Icon, IconButton, Input, Switch } from "@webiny/admin-ui";
import { Form, useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { ReactComponent as GlobeIcon } from "@webiny/icons/language.svg";
import { ReactComponent as OpenInNew } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as RemoveLink } from "@webiny/icons/link_off.svg";

type LexicalLinkForm = NonNullable<
    React.ComponentProps<typeof FloatingLinkEditorPlugin>["LinkForm"]
>;
type LinkFormProps = React.ComponentProps<LexicalLinkForm>;

export const LexicalLinkForm = ({ linkData, onSave, removeLink }: LinkFormProps) => {
    const onSubmit = (data: LinkFormProps["linkData"]) => {
        onSave(data);
    };

    return (
        <Form data={linkData} onSubmit={onSubmit} validateOnFirstSubmit submitOnEnter>
            {form => (
                <div className={"p-md"}>
                    <Grid gap={"small"}>
                        <Grid.Column span={12}>
                            <UrlInput />
                        </Grid.Column>
                    </Grid>
                    <div className={"flex w-full items-center justify-between mt-sm gap-sm"}>
                        <TargetSwitch />
                        <Button
                            variant={"ghost"}
                            text={`Remove link`}
                            className={"text-destructive-primary! [&_svg]:fill-destructive"}
                            onClick={removeLink}
                            icon={<Icon label={"Remove link"} icon={<RemoveLink />} />}
                        />
                        <Button variant={"primary"} text={`Save`} onClick={form.submit} />
                    </div>
                </div>
            )}
        </Form>
    );
};

const UrlInput = () => {
    const urlBind = useBind({
        name: "url",
        validators: validation.create("required,url")
    });

    const openInNewTab = () => {
        if (urlBind.validation.isValid !== false && urlBind.value) {
            window.open(urlBind.value, "_blank");
        }
    };

    return (
        <Input
            {...urlBind}
            variant={"secondary"}
            placeholder={"Enter link"}
            autoFocus={true}
            startIcon={<Icon label="globe" icon={<GlobeIcon />} />}
            endIcon={<IconButton variant="ghost" icon={<OpenInNew />} onClick={openInNewTab} />}
        />
    );
};

const TargetSwitch = () => {
    const targetBind = useBind({
        name: "target",
        defaultValue: "_self"
    });

    return (
        <Switch
            checked={targetBind.value === "_blank"}
            label={"Open in new tab"}
            onChange={value => {
                targetBind.onChange(value === true ? "_blank" : "_self");
            }}
        />
    );
};

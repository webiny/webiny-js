import React from "react";
import type { FloatingLinkEditorPlugin } from "@webiny/lexical-editor";
import { Button, Grid, Icon, IconButton, Input, Switch } from "@webiny/admin-ui";
import { Bind, Form } from "@webiny/form";
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
        <Form data={linkData} onSubmit={onSubmit} validateOnFirstSubmit={true}>
            {form => (
                <div className={"p-md"}>
                    <Grid gap={"small"}>
                        <Grid.Column span={12}>
                            <Bind name={"url"} validators={validation.create("url")}>
                                {bind => (
                                    <Input
                                        {...bind}
                                        onEnter={form.submit}
                                        variant={"secondary"}
                                        placeholder={"Enter link"}
                                        autoFocus={true}
                                        startIcon={<Icon label="globe" icon={<GlobeIcon />} />}
                                        endIcon={
                                            <IconButton
                                                variant="ghost"
                                                icon={<OpenInNew />}
                                                onClick={() => {
                                                    if (
                                                        bind.validation.isValid !== false &&
                                                        bind.value
                                                    ) {
                                                        window.open(bind.value, "_blank");
                                                    }
                                                }}
                                            />
                                        }
                                    />
                                )}
                            </Bind>
                        </Grid.Column>
                    </Grid>
                    <div className={"flex w-full items-center justify-between mt-sm"}>
                        <Bind name={"target"}>
                            {({ value, onChange }) => (
                                <Switch
                                    checked={value === "_blank"}
                                    label={"Open link in a new tab"}
                                    onChange={value => {
                                        onChange(value === true ? "_blank" : null);
                                        form.submit();
                                    }}
                                />
                            )}
                        </Bind>
                        <Button
                            variant={"ghost"}
                            text={`Remove link`}
                            className={"text-destructive-primary! [&_svg]:fill-destructive"}
                            onClick={removeLink}
                            icon={<Icon label={"Remove link"} icon={<RemoveLink />} />}
                        />
                    </div>
                </div>
            )}
        </Form>
    );
};

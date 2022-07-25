import * as React from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import { validation } from "@webiny/validation";
import { FormOnSubmit } from "@webiny/form/types";
import { MenuTreeItem } from "~/admin/views/Menus/types";

const menuFormStyle = {
    color: "var(--mdc-theme-on-surface)",
    backgroundColor: "var(--mdc-theme-background) !important"
};

interface LinkFormProps {
    data: MenuTreeItem;
    onSubmit: FormOnSubmit;
    onCancel: () => void;
}
const LinkForm: React.FC<LinkFormProps> = ({ data, onSubmit, onCancel }) => {
    return (
        <Elevation z={4} css={menuFormStyle}>
            <Form data={data} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Link menu item</Typography>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label="Title" data-testid="pb.menu.new.link.title" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="url"
                                    validators={validation.create(
                                        "required,url:allowRelative:allowHref"
                                    )}
                                >
                                    <Input label="URL" data-testid="pb.menu.new.link.url" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <ButtonSecondary onClick={onCancel}>Cancel</ButtonSecondary>
                                <ButtonPrimary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                    style={{ float: "right" }}
                                    data-testid="pb.menu.new.link.button.save"
                                >
                                    Save menu item
                                </ButtonPrimary>
                            </Cell>
                        </Grid>
                    </>
                )}
            </Form>
        </Elevation>
    );
};

export default LinkForm;

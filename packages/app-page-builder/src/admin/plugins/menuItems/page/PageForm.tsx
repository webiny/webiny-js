import * as React from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { PagesAutocomplete } from "~/admin/components/PagesAutocomplete";
import { Elevation } from "@webiny/ui/Elevation";
import { validation } from "@webiny/validation";
import { FormOnCancel, FormOnSubmit } from "@webiny/form/Form";
import { MenuTreeItem } from "~/admin/views/Menus/types";

const menuPageFormStyle = {
    color: "var(--mdc-theme-on-surface)",
    backgroundColor: "var(--mdc-theme-background) !important"
};

interface LinkFormProps {
    data: MenuTreeItem;
    onSubmit: FormOnSubmit;
    onCancel: FormOnCancel;
}
const LinkForm: React.FC<LinkFormProps> = ({ data, onSubmit, onCancel }) => {
    return (
        <Elevation z={4} css={menuPageFormStyle}>
            <Form data={data} onSubmit={onSubmit}>
                {({ submit, Bind, data, form }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Page menu item</Typography>
                            </Cell>
                        </Grid>

                        <Grid>
                            <Cell span={12}>
                                <Bind name="page" validators={validation.create("required")}>
                                    {({ onChange, ...rest }) => (
                                        <PagesAutocomplete
                                            {
                                                /**
                                                 * Find better suited type
                                                 */
                                                // TODO @ts-refactor
                                                ...(rest as any)
                                            }
                                            onChange={(value: string, selection: MenuTreeItem) => {
                                                onChange(value);
                                                if (!data.title && selection) {
                                                    form.setValue("title", selection.title);
                                                }
                                            }}
                                            label="Page"
                                        />
                                    )}
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label="Title" />
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

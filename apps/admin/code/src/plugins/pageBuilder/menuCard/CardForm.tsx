import * as React from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import { validation } from "@webiny/validation";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

const CardForm = ({ data, onSubmit, onCancel }) => {
    return (
        <Elevation z={4}>
            <Form data={data} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Card menu item</Typography>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label={`Title`} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="action.label">
                                    <Input label={`Action Label`} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="action.link" validators={validation.create("url")}>
                                    <Input label={`Action Link`} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="poster.alt">
                                    <Input label={`Poster Alt Text`} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="poster.url">
                                    <SingleImageUpload label={`Poster `} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <ButtonSecondary onClick={onCancel}>Cancel</ButtonSecondary>
                                <ButtonPrimary onClick={submit} style={{ float: "right" }}>
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

export default CardForm;

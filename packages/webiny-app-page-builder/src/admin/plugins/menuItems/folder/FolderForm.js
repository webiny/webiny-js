// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Input } from "webiny-ui/Input";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonSecondary, ButtonPrimary } from "webiny-ui/Button";
import { Elevation } from "webiny-ui/Elevation";

const FolderForm = ({ data, onSubmit, onCancel }: Object) => {
    return (
        <Elevation z={4}>
            <Form data={data} onSubmit={onSubmit}>
                {({ submit, Bind }) => (
                    <>
                        <Grid>
                            <Cell span={12}>
                                <Typography use={"overline"}>Folder menu item</Typography>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={["required"]}>
                                    <Input label={`Title`} />
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

export default FolderForm;

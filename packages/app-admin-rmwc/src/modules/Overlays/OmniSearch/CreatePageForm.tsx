import React from "react";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";

export const CreatePageForm = () => {
    const [loading, setLoading] = React.useState(false);

    return (
        <Form onSubmit={(data) => {
            console.log('de', data)
        }}>
            {({ data, form, Bind }) => (
                <>
                    {loading && <CircularProgress />}
                    <Grid>
                        <Cell span={12}>
                            <Bind name="name" validators={validation.create("required")}>
                                <Input label={`Name`} data-testid="pb.category.new.form.name" autoFocus={true} />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind name="slug" validators={validation.create("required")}>
                                <Input
                                    disabled={data.createdOn}
                                    label={`Slug`}
                                    data-testid="pb.category.new.form.slug"
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                </>
            )}
        </Form>
    );
};

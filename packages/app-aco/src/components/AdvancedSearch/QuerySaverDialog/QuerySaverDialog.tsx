import React, { useEffect, useState } from "react";

import { Form, FormOnSubmit } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";

import { QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter";

import { QueryObjectDTO } from "../QueryObject";

import { DialogContainer } from "./QuerySaverDialog.styled";

interface QuerySaverDialogProps {
    onClose: () => void;
    onSubmit: (data: QueryObjectDTO) => void;
    open: boolean;
    queryObject: QueryObjectDTO;
}

export const QuerySaverDialog = ({ queryObject, ...props }: QuerySaverDialogProps) => {
    const [presenter] = useState<QuerySaverDialogPresenter>(
        new QuerySaverDialogPresenter(queryObject)
    );

    useEffect(() => {
        presenter.load(queryObject);
    }, [queryObject]);

    const onChange = (data: QueryObjectDTO) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QueryObjectDTO> = () => {
        presenter.onSubmit(queryObject => {
            props.onSubmit(queryObject);
        });
    };

    return (
        <DialogContainer open={props.open} onClose={props.onClose}>
            {props.open ? (
                <Form
                    data={presenter.vm.queryObject}
                    onChange={onChange}
                    onSubmit={onFormSubmit}
                    invalidFields={presenter.vm.invalidFields}
                >
                    {({ Bind, form }) => (
                        <>
                            <DialogTitle>{"Save search filter"}</DialogTitle>
                            <DialogContent>
                                <Grid>
                                    <Cell span={12} align={"middle"}>
                                        <Bind name={"name"}>
                                            <Input type={"text"} label={"Name"} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12} align={"middle"}>
                                        <Bind name={"description"}>
                                            <Input type={"text"} label={"Description"} rows={6} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <ButtonDefault onClick={props.onClose}>{"Cancel"}</ButtonDefault>
                                <ButtonPrimary onClick={form.submit}>
                                    {"Save and apply"}
                                </ButtonPrimary>
                            </DialogActions>
                        </>
                    )}
                </Form>
            ) : null}
        </DialogContainer>
    );
};

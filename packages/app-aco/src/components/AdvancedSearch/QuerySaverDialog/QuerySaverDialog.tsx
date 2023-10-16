import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

import { Form, FormOnSubmit } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";

import { QuerySaverDialogFormData, QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter";

import { QueryObjectDTO } from "../domain";

import { DialogContainer } from "./QuerySaverDialog.styled";

interface QuerySaverDialogProps {
    onClose: () => void;
    onSubmit: (data: QueryObjectDTO) => void;
    open: boolean;
    isLoading: boolean;
    loadingLabel: string;
    queryObject: QueryObjectDTO;
}

export const QuerySaverDialog = observer(({ queryObject, ...props }: QuerySaverDialogProps) => {
    const [presenter] = useState<QuerySaverDialogPresenter>(
        new QuerySaverDialogPresenter(queryObject)
    );

    useEffect(() => {
        presenter.load(queryObject);
    }, [queryObject]);

    const onChange = (data: QuerySaverDialogFormData) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QuerySaverDialogFormData> = () => {
        presenter.onSubmit(queryObject => {
            props.onSubmit(queryObject);
        });
    };

    return (
        <DialogContainer open={props.open} onClose={props.onClose}>
            {props.open ? (
                <Form
                    data={presenter.vm.data}
                    onChange={onChange}
                    onSubmit={onFormSubmit}
                    invalidFields={presenter.vm.invalidFields}
                >
                    {({ Bind, form }) => (
                        <>
                            <DialogTitle>{"Save search filter"}</DialogTitle>
                            {props.isLoading && <CircularProgress label={props.loadingLabel} />}
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
});

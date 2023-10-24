import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

import { Form, FormOnSubmit } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";

import { QuerySaverDialogFormData, QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter";

import { FilterDTO } from "../domain";

import { DialogContainer } from "./QuerySaverDialog.styled";

interface QuerySaverDialogProps {
    onClose: () => void;
    onSubmit: (data: FilterDTO) => void;
    filter: FilterDTO;
    vm: {
        isOpen: boolean;
        isLoading: boolean;
        loadingLabel: string;
    };
}

export const QuerySaverDialog = observer(({ filter, ...props }: QuerySaverDialogProps) => {
    const [presenter] = useState<QuerySaverDialogPresenter>(new QuerySaverDialogPresenter());

    useEffect(() => {
        presenter.load(filter);
    }, [filter]);

    const onChange = (data: QuerySaverDialogFormData) => {
        presenter.setFilter(data);
    };

    const onFormSubmit: FormOnSubmit<QuerySaverDialogFormData> = () => {
        presenter.onSubmit(queryObject => {
            props.onSubmit(queryObject);
        });
    };

    return (
        <DialogContainer open={props.vm.isOpen} onClose={props.onClose}>
            {props.vm.isOpen ? (
                <Form
                    data={presenter.vm.data}
                    onChange={onChange}
                    onSubmit={onFormSubmit}
                    invalidFields={presenter.vm.invalidFields}
                >
                    {({ Bind, form }) => (
                        <>
                            <DialogTitle>{"Save search filter"}</DialogTitle>
                            {props.vm.isLoading && (
                                <CircularProgress label={props.vm.loadingLabel} />
                            )}
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

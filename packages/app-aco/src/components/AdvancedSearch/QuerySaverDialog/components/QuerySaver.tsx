import React from "react";
import { Observer, observer } from "mobx-react-lite";

import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";

import { DialogContainer } from "./QuerySaver.styled";
import { QuerySaverPresenter } from "../adapters";
import { Form } from "@webiny/form";
import { Mode, QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";

interface QueryManagerProps {
    mode: Mode;
    presenter: QuerySaverPresenter;
    open: boolean;
    onClose: () => void;
    onSubmit: (data: QueryObjectDTO) => void;
}

export const QuerySaver = observer(({ presenter, ...props }: QueryManagerProps) => {
    const viewModel = presenter.getViewModel();

    const onChange = (data: QueryObjectDTO) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit = () => {
        presenter.persistQueryObject(props.mode);
        props.onSubmit(viewModel.queryObject);
    };

    return (
        <DialogContainer open={props.open} onClose={props.onClose}>
            {props.open ? (
                <>
                    <DialogTitle>{"Save search filter"}</DialogTitle>
                    <DialogContent>
                        <Form data={viewModel.queryObject} onChange={onChange}>
                            {({ Bind }) => (
                                <Observer>
                                    {() => (
                                        <Grid>
                                            <Cell span={12} align={"middle"}>
                                                <Bind name={"name"}>
                                                    <Input type={"text"} label={"Name"} />
                                                </Bind>
                                            </Cell>

                                            <Cell span={12} align={"middle"}>
                                                <Bind name={"description"}>
                                                    <Input
                                                        type={"text"}
                                                        label={"Description"}
                                                        rows={6}
                                                    />
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    )}
                                </Observer>
                            )}
                        </Form>
                    </DialogContent>
                    <DialogActions>
                        <ButtonDefault onClick={props.onClose}>{"Cancel"}</ButtonDefault>
                        <ButtonPrimary onClick={onFormSubmit}>{"Save and apply"}</ButtonPrimary>
                    </DialogActions>
                </>
            ) : null}
        </DialogContainer>
    );
});

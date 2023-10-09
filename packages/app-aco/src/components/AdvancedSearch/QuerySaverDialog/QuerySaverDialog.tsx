import React, { useEffect, useState } from "react";
import { QuerySaverPresenter } from "./QuerySaverPresenter";

import { QueryObjectDTO, QueryObjectRepository } from "~/components/AdvancedSearch/QueryObject";
import { Form, FormOnSubmit } from "@webiny/form";
import { DialogContainer } from "~/components/AdvancedSearch/QuerySaverDialog/QuerySaverDialog.styled";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

interface QuerySaverDialogProps {
    mode: string;
    onClose: () => void;
    onSubmit: (data: QueryObjectDTO) => void;
    open: boolean;
    queryObject: QueryObjectDTO | null;
    repository: QueryObjectRepository;
}

export const QuerySaverDialog = ({ queryObject, repository, ...props }: QuerySaverDialogProps) => {
    const [presenter] = useState<QuerySaverPresenter>(new QuerySaverPresenter(repository));

    useEffect(() => {
        presenter.load();
    }, []);

    useEffect(() => {
        presenter.updateQueryObject(queryObject);
    }, [queryObject]);

    const onChange = (data: QueryObjectDTO) => {
        presenter.setQueryObject(data);
    };

    const onFormSubmit: FormOnSubmit<QueryObjectDTO> = async data => {
        await presenter.onSubmit(data, () => {
            props.onSubmit(data);
            presenter.persistQueryObject(data, props.mode);
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

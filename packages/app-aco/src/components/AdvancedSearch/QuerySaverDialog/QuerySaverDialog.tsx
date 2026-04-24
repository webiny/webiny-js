import React, { useEffect, useMemo } from "react";
import { Dialog, Grid, Input, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import type { QuerySaverDialogFormData } from "./QuerySaverDialogPresenter.js";
import { QuerySaverDialogPresenter } from "./QuerySaverDialogPresenter.js";
import type { FilterDTO } from "../domain/index.js";

interface QuerySaverDialogProps {
    onClose: () => void;
    onSave: (data: FilterDTO) => void;
    filter: FilterDTO;
    vm: {
        isOpen: boolean;
        isLoading: boolean;
        loadingLabel: string;
    };
}

export const QuerySaverDialog = ({ filter, ...props }: QuerySaverDialogProps) => {
    const presenter = useMemo<QuerySaverDialogPresenter>(() => {
        return new QuerySaverDialogPresenter();
    }, []);

    useEffect(() => {
        presenter.load(filter);
    }, [filter]);

    const onChange = (data: QuerySaverDialogFormData) => {
        presenter.setFilter(data);
    };

    const onSubmit = () => {
        presenter.onSave(filter => {
            props.onSave(filter);
        });
    };

    return (
        <Form
            data={presenter.vm.data}
            onChange={onChange}
            onSubmit={onSubmit}
            invalidFields={presenter.vm.invalidFields}
        >
            {({ Bind, form }) => {
                return (
                    <Dialog
                        open={props.vm.isOpen}
                        onClose={props.onClose}
                        title={"Save search filter"}
                        actions={
                            <>
                                <Dialog.CancelAction onClick={props.onClose} text={"Cancel"} />
                                <Dialog.ConfirmAction
                                    onClick={form.submit}
                                    text={"Save and apply"}
                                />
                            </>
                        }
                    >
                        {props.vm.isOpen ? (
                            <>
                                {props.vm.isLoading && (
                                    <OverlayLoader text={props.vm.loadingLabel} />
                                )}
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind name={"name"}>
                                            <Input type={"text"} label={"Name"} size={"lg"} />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind name={"description"}>
                                            <Textarea label={"Description"} rows={6} size={"lg"} />
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </>
                        ) : null}
                    </Dialog>
                );
            }}
        </Form>
    );
};

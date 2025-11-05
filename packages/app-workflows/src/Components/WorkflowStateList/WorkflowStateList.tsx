import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowStateList } from "./hooks/index.js";
import { Alert, DataTable, DataTableColumns } from "@webiny/admin-ui";
import type { IGenericError, IWorkflowState } from "~/types.js";

const columns: DataTableColumns<IWorkflowState> = {
    title: {
        header: "Title",
        enableSorting: true
    },
    app: {
        header: "Application",
        enableSorting: false
    },
    savedOn: {
        header: "Last Modified",
        enableSorting: true
    },
    createdBy: {
        header: "Submitted By",
        enableSorting: false
    },
    state: {
        header: "Workflow",
        enableSorting: false,
        cell(row) {
            return <>workflow: {row.currentStep.title}</>;
        }
    }
};

interface IErrorProps {
    error: IGenericError | null;
}
const Error = (props: IErrorProps) => {
    const { error } = props;
    if (!error) {
        return null;
    }
    return <Alert type="danger">{error.message}</Alert>;
};

export const WorkflowStateList = observer(() => {
    const { presenter } = useWorkflowStateList();

    return (
        <>
            <Error error={presenter.vm.error} />
            <DataTable loading={presenter.vm.loading} columns={columns} data={presenter.vm.items} />
        </>
    );
});

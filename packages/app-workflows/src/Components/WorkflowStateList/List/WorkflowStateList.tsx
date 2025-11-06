import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowStateList } from "../hooks/index.js";
import { Alert, DataTable, DataTableColumns, Tag } from "@webiny/admin-ui";
import { type IGenericError, type IWorkflowState } from "~/types.js";
import { getTagStateVariant } from "~/Components/helpers/tagStateVariant.js";
import { getStateName } from "~/Components/helpers/stateName.js";

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
        enableSorting: false,
        cell(row) {
            return <>{row.createdBy.displayName}</>;
        }
    },
    currentStep: {
        header: "Workflow",
        enableSorting: false,
        cell(row) {
            return <Tag content={row.currentStep.title} />;
        }
    },
    state: {
        header: "Status",
        enableSorting: false,
        cell(row) {
            return <Tag variant={getTagStateVariant(row.state)} content={getStateName(row.state)} />;
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
            <DataTable
                bordered={false}
                stickyHeader={false}
                loading={presenter.vm.loading}
                columns={columns}
                data={presenter.vm.items}
            />
        </>
    );
});

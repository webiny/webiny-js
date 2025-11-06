import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowStateList } from "../hooks/index.js";
import { Alert, DataTable, DataTableColumns, Tag, type TagProps } from "@webiny/admin-ui";
import { type IGenericError, type IWorkflowState, WorkflowStateValue } from "~/types.js";

const getStateName = (state: WorkflowStateValue): string => {
    switch (state) {
        case WorkflowStateValue.pending:
            return "Pending";
        case WorkflowStateValue.inReview:
            return "In Review";
        case WorkflowStateValue.approved:
            return "Approved";
        case WorkflowStateValue.rejected:
            return "Rejected";
        default:
            return state;
    }
};

const getTagStateVariant = (state: WorkflowStateValue): TagProps["variant"] => {
    switch (state) {
        case WorkflowStateValue.pending:
            return "neutral-base";
        case WorkflowStateValue.inReview:
            return "warning";
        case WorkflowStateValue.approved:
            return "success-light";
        case WorkflowStateValue.rejected:
            return "destructive";
        default:
            return "neutral-base";
    }
}

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

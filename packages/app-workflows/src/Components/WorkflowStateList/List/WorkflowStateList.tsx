import React from "react";
import { observer } from "mobx-react-lite";
import { useWorkflowStateList } from "../hooks/index.js";
import { Alert, DataTable, DataTableColumns, TimeAgo, Heading } from "@webiny/admin-ui";
import { type IGenericError, type IWorkflowState } from "~/types.js";
import { TagState } from "~/Components/Common/TagState.js";
import { TagStep } from "~/Components/Common/TagStep.js";
import { WorkflowStateListOptions } from "./WorkflowStateListOptions.js";
import { WorkflowStateListFilters } from "./WorkflowStateListFilters.js";

const columns: DataTableColumns<IWorkflowState> = {
    title: {
        header: "Title",
        enableSorting: true
    },
    createdBy: {
        header: "Submitted By",
        enableSorting: false,
        cell(state) {
            return <>{state.createdBy.displayName}</>;
        }
    },
    savedBy: {
        header: "Modified By",
        enableSorting: false,
        cell(state) {
            if (state.savedBy.id === state.createdBy.id) {
                return <>-</>;
            }
            return <>{state.savedBy.displayName}</>;
        }
    },
    savedOn: {
        header: "Last Modified",
        enableSorting: true,
        cell(state) {
            return <TimeAgo datetime={state.savedOn} />;
        }
    },

    currentStep: {
        header: "Workflow",
        enableSorting: false,
        cell(state) {
            return <TagStep step={state.currentStep} />;
        }
    },
    state: {
        header: "Status",
        enableSorting: false,
        cell(state) {
            return <TagState state={state.state} />;
        }
    },
    id: {
        header: "",
        enableSorting: false,
        enableHiding: false,
        className: "text-right",
        enableResizing: false,
        cell(state) {
            return <WorkflowStateListOptions state={state} />;
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
            <Heading level={4} className={"px-lg py-md"}>
                Content Reviews
            </Heading>
            <Error error={presenter.vm.error} />
            <WorkflowStateListFilters />
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

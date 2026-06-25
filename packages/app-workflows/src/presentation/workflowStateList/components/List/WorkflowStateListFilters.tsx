import React from "react";
import { Grid, SegmentedControl } from "@webiny/admin-ui";
import { useWorkflowStateListPresenter } from "~/presentation/workflowStateList/useWorkflowStateListPresenter.js";
import type { WorkflowStateValue } from "~/types.js";
import { observer } from "mobx-react-lite";

const stateItems = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "In Review", value: "inReview" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" }
];

type PossibleTypes = "own" | "requested";

const typeItems = [
    { label: "All", value: "all" },
    { label: "My Content Reviews", value: "own" },
    { label: "I Can Access", value: "requested" }
];

export const WorkflowStateListFilters = observer(() => {
    const presenter = useWorkflowStateListPresenter();

    const currentState = presenter.vm.where?.state || "all";
    const currentType = presenter.vm.type || "all";

    const handleStateChange = (value: string) => {
        const state = value === "all" ? undefined : (value as WorkflowStateValue);
        presenter.filterBy({
            state
        });
    };

    const handleTypeChange = (value: string) => {
        if (value === "all") {
            presenter.setType("all");
        } else {
            presenter.setType(value as PossibleTypes);
        }
    };

    return (
        <Grid className={"px-lg py-sm-plus bg-neutral-subtle border-neutral-dimmed border-sm"}>
            <Grid.Column span={6}>
                <SegmentedControl
                    items={stateItems}
                    value={currentState}
                    onChange={handleStateChange}
                />
            </Grid.Column>
            <Grid.Column span={6} className={"text-right"}>
                <SegmentedControl
                    items={typeItems}
                    value={currentType}
                    onChange={handleTypeChange}
                />
            </Grid.Column>
        </Grid>
    );
});

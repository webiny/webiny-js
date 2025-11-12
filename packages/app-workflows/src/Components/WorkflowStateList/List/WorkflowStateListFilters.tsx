import React, { useMemo } from "react";
import { Grid, Tag, type TagProps } from "@webiny/admin-ui";
import type { GenericRecord } from "@webiny/app/types.js";
import { useWorkflowStateList } from "~/Components/WorkflowStateList/hooks/index.js";
import type { WorkflowStateValue } from "~/types.js";
import { observer } from "mobx-react-lite";

interface IValue {
    label: string;
    variant: TagProps["variant"];
}

type PossibleStates = WorkflowStateValue | "all";

const possibleStates: GenericRecord<PossibleStates, IValue> = {
    all: {
        label: "All",
        variant: "neutral-light"
    },
    pending: {
        label: "Pending",
        variant: "neutral-base"
    },
    inReview: {
        label: "In Review",
        variant: "neutral-strong"
    },
    approved: {
        label: "Approved",
        variant: "success"
    },
    rejected: {
        label: "Rejected",
        variant: "destructive"
    }
};

type PossibleTypes = "all" | "own" | "requested";

const possibleTypes: GenericRecord<PossibleTypes, IValue> = {
    all: {
        label: "All",
        variant: "neutral-base"
    },
    own: {
        label: "My Content Reviews",
        variant: "neutral-light"
    },
    requested: {
        label: "I Can Access",
        variant: "neutral-strong"
    }
};

export const WorkflowStateListFilters = observer(() => {
    const { presenter } = useWorkflowStateList();

    const clickOnState = useMemo(() => {
        return (tag: keyof typeof possibleStates) => {
            const state = tag === "all" ? undefined : tag;
            return () => {
                presenter.filterBy({
                    state
                });
            };
        };
    }, [presenter]);

    const clickOnType = useMemo(() => {
        return (tag: keyof typeof possibleTypes) => {
            const type = tag === "all" ? undefined : tag;
            return () => {
                presenter.setType(type);
            };
        };
    }, [presenter]);

    return (
        <Grid>
            <Grid.Column span={6} className={"p-sm"}>
                {(Object.keys(possibleStates) as PossibleStates[]).map(key => {
                    const tag = possibleStates[key];
                    const active =
                        presenter.vm.where?.state === key ||
                        (key === "all" && !presenter.vm.where?.state);
                    return (
                        <Tag
                            disabled={active}
                            variant={tag.variant}
                            key={`state-${key}`}
                            content={tag.label}
                            onClick={clickOnState(key)}
                        />
                    );
                })}
            </Grid.Column>
            <Grid.Column span={6} className={"text-right p-sm"}>
                {(Object.keys(possibleTypes) as PossibleTypes[]).map(key => {
                    const tag = possibleTypes[key];
                    const active =
                        presenter.vm.type === key || (key === "all" && !presenter.vm.type);
                    return (
                        <Tag
                            disabled={active}
                            variant={tag.variant}
                            key={`type-${key}`}
                            content={tag.label}
                            onClick={clickOnType(key)}
                        />
                    );
                })}
            </Grid.Column>
        </Grid>
    );
});

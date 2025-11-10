import React, { useMemo } from "react";
import { Grid, Tag, type TagProps } from "@webiny/admin-ui";
import type { GenericRecord } from "@webiny/app/types.js";
import { useWorkflowStateList } from "~/Components/WorkflowStateList/hooks/index.js";
import type { WorkflowStateValue } from "~/types.js";
import { observer } from "mobx-react-lite";

interface ITag {
    label: string;
    variant: TagProps["variant"];
}

type TagTypes = WorkflowStateValue | "all";

const tags: GenericRecord<TagTypes, ITag> = {
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

export const WorkflowStateListFilters = observer(() => {
    const { presenter } = useWorkflowStateList();

    const clickOn = useMemo(() => {
        return (tag: keyof typeof tags) => {
            const state = tag === "all" ? undefined : tag;
            return () => {
                presenter.filterBy({
                    state
                });
            };
        };
    }, [presenter.vm]);

    return (
        <Grid>
            <Grid.Column span={3} className={"p-sm"}>
                {(Object.keys(tags) as TagTypes[]).map(key => {
                    const tag = tags[key];
                    const active =
                        presenter.vm.where.state === key ||
                        (key === "all" && !presenter.vm.where.state);
                    return (
                        <Tag
                            disabled={active}
                            variant={tag.variant}
                            key={`state-${key}`}
                            content={tag.label}
                            onClick={clickOn(key)}
                        />
                    );
                })}
            </Grid.Column>
        </Grid>
    );
});

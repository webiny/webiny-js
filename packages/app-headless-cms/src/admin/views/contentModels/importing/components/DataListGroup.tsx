import React from "react";
import styled from "@emotion/styled";
import { DataListModels } from "./Model";
import { ImportGroupData, ImportModelData } from "../types";

const Container = styled("div")({
    marginTop: "10px",
    backgroundColor: "var(--mdc-theme-background)",
    border: "1px dashed var(--mdc-theme-on-background)",
    padding: "10px",
    borderBox: "box-sizing"
});

const GroupName = styled("h3")({
    fontSize: "16px"
});

interface GroupProps {
    group: Pick<ImportGroupData, "id" | "name">;
}

const Group = ({ group }: GroupProps) => {
    return <GroupName>{group.name || group.id}</GroupName>;
};

interface DataListGroupProps {
    group: Pick<ImportGroupData, "id" | "name">;
    models: ImportModelData[];
}

export const DataListGroup = ({ group, models }: DataListGroupProps) => {
    return (
        <Container>
            <Group group={group} />
            <DataListModels models={models} />
        </Container>
    );
};

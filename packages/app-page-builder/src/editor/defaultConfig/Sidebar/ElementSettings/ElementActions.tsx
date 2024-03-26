import React from "react";
import styled from "@emotion/styled";
import { COLORS } from "~/editor/plugins/elementSettings/components/StyledComponents";
import { EditorConfig } from "~/editor/config";

const SidebarActions = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    borderBottom: `1px solid ${COLORS.gray}`,
    backgroundColor: COLORS.lightGray,
    borderTop: `1px solid ${COLORS.gray}`,
    justifyContent: "center"
});

export const ElementActions = () => {
    return (
        <SidebarActions>
            <EditorConfig.Sidebar.Elements group={"actions"} />
        </SidebarActions>
    );
};

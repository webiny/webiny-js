import React, { useRef } from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { Typography } from "@webiny/ui/Typography";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Icon } from "@webiny/ui/Icon";
import { EditTab } from "./Tabs/EditTab";
import { TriggersTab } from "./Tabs/TriggersTab";
import { PreviewTab } from "./Tabs/PreviewTab";
import { Fields } from "./Fields";

import { ReactComponent as FormIcon } from "./icons/round-assignment-24px.svg";

const ContentContainer = styled("div")({
    paddingTop: 65
});

const LeftBarTitle = styled("div")({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    display: "flex",
    alignItems: "center",
    padding: 25,
    color: "var(--mdc-theme-on-surface)"
});

const titleIcon = css({
    height: 24,
    marginRight: 15,
    color: "var(--mdc-theme-primary)"
});

const LeftBarFieldList = styled("div")({
    padding: 40
});

const formTabs = css({
    "&.webiny-ui-tabs": {
        ".webiny-ui-tabs__tab-bar": {
            backgroundColor: "var(--mdc-theme-surface)"
        }
    }
});

export default function EditorContent() {
    const tabsRef = useRef();
    return (
        <ContentContainer>
            <SplitView>
                <LeftPanel span={4}>
                    <LeftBarTitle>
                        <Icon className={titleIcon} icon={<FormIcon />} />
                        <Typography use={"headline6"}>Form Elements</Typography>
                    </LeftBarTitle>
                    <LeftBarFieldList>
                        <Fields onFieldDragStart={() => tabsRef.current.switchTab(0)} />
                    </LeftBarFieldList>
                </LeftPanel>
                <RightPanel span={8}>
                    <Tabs className={formTabs} ref={tabsRef}>
                        <Tab label={"Edit"}>
                            <EditTab />
                        </Tab>
                        <Tab label={"Preview"}>
                            <PreviewTab />
                        </Tab>
                        <Tab label={"Triggers"}>
                            <TriggersTab />
                        </Tab>
                    </Tabs>
                </RightPanel>
            </SplitView>
        </ContentContainer>
    );
}

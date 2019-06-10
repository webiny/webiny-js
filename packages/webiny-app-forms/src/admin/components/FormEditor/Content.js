import React from "react";
import { css } from "emotion";
import styled from "react-emotion";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { Typography } from "webiny-ui/Typography";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Icon } from "webiny-ui/Icon";
import { EditTab } from "./Tabs/EditTab";
import { TriggersTab } from "./Tabs/TriggersTab";
import { PreviewTab } from "./Tabs/PreviewTab";
import { Fields } from "./Fields";
import { useHotkeys } from "react-hotkeyz";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

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

export default function Content() {
    const { saveForm } = useFormEditor();

    useHotkeys({
        zIndex: 100,
        keys: {
            "cmd+s": e => {
                e.preventDefault();
                saveForm();
            }
        }
    });
    return (
        <ContentContainer>
            <SplitView>
                <LeftPanel span={4}>
                    <LeftBarTitle>
                        <Icon className={titleIcon} icon={<FormIcon />} />
                        <Typography use={"headline6"}>Form Elements</Typography>
                    </LeftBarTitle>
                    <LeftBarFieldList>
                        <Fields />
                    </LeftBarFieldList>
                </LeftPanel>
                <RightPanel span={8}>
                    <Tabs>
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

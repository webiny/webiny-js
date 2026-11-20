import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { LayoutNodeRenderer } from "@webiny/app-admin";
import type { TabsNodeRendererProps } from "@webiny/app-admin";
import { countLayoutErrors } from "./countLayoutErrors.js";
import { StepDrawerTabLabel } from "./StepDrawerTabLabel.js";

/*
 * The tabs of the step drawer form: the stock tabs, with the count of a tab's field errors beside
 * its label (B23) in place of the stock error asterisk.
 */
export const StepDrawerTabsRenderer = createReactiveComponent(function StepDrawerTabsRenderer({
    node
}: TabsNodeRendererProps) {
    return (
        <Tabs
            value={node.activeTabId}
            onValueChange={id => node.setActiveTab(id)}
            tabs={node.tabs.map(tab => (
                <Tabs.Tab
                    key={tab.id}
                    value={tab.id}
                    trigger={
                        <StepDrawerTabLabel
                            label={tab.label}
                            errorCount={countLayoutErrors(tab.layout)}
                        />
                    }
                    disabled={tab.disabled}
                    content={
                        <div className={"flex flex-col gap-4 mt-md"}>
                            {tab.layout.map((childNode, index) => (
                                <LayoutNodeRenderer key={index} node={childNode} />
                            ))}
                        </div>
                    }
                />
            ))}
        />
    );
});

import React from "react";
import { observer } from "mobx-react-lite";
import { Tabs } from "@webiny/admin-ui";
import { LayoutNodeRenderer, renderTabIcon } from "~/features/formModel/FormView.js";
import type { TabsNodeRendererProps } from "~/features/formModel/FormView.js";

export const HorizontalTabsRenderer = observer(function HorizontalTabsRenderer({
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
                    icon={renderTabIcon(tab.icon)}
                    trigger={tab.label}
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

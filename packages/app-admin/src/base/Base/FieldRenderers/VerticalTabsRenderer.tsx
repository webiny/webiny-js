import React from "react";
import { observer } from "mobx-react-lite";
import { List, Heading, Text } from "@webiny/admin-ui";
import { LayoutNodeRenderer } from "~/features/formModel/FormView.js";
import type { TabsNodeRendererProps } from "~/features/formModel/FormView.js";

export const VerticalTabsRenderer = observer(function VerticalTabsRenderer({
    node
}: TabsNodeRendererProps) {
    const activeTab = node.tabs.find(t => t.id === node.activeTabId);

    return (
        <div className={"flex flex-row flex-1 min-h-full shrink-0"}>
            <div className={"flex flex-col"} style={{ width: 300 }}>
                <List>
                    {node.tabs.map(tab => (
                        <List.Item
                            key={tab.id}
                            className={"fill-neutral-strong"}
                            icon={tab.icon}
                            title={tab.label}
                            description={tab.description}
                            activated={tab.id === node.activeTabId}
                            onClick={() => node.setActiveTab(tab.id)}
                        />
                    ))}
                </List>
            </div>
            <div className={"flex flex-col flex-1 px-md border-l border-neutral-dimmed"}>
                {activeTab && (
                    <>
                        <div className={"p-md"}>
                            <Heading level={4} className={"text-neutral-primary"}>
                                {activeTab.label}
                            </Heading>
                            {activeTab.description && (
                                <Text size={"sm"}>{activeTab.description}</Text>
                            )}
                        </div>
                        <div className={"p-md flex flex-col gap-4"}>
                            {activeTab.layout.map((childNode, index) => (
                                <LayoutNodeRenderer key={index} node={childNode} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});

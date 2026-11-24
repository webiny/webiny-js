import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { LayoutNodeRenderer } from "@webiny/app-admin";
import type { TabsNodeRendererProps } from "@webiny/app-admin";
import { PEOPLE_TAB } from "~/editor/presentation/stepForm/peopleTabs.js";
import { useStepFormOptions } from "~/editor/presentation/stepForm/useStepFormOptions.js";
import { countRuleErrors } from "./countRuleErrors.js";
import { countLayoutErrors } from "./countLayoutErrors.js";
import { StepDrawerTabLabel } from "./StepDrawerTabLabel.js";

/*
 * The tabs of the step drawer form: the stock tabs, with the count of a tab's errors (field errors and
 * live rule errors) beside its label (B23) in place of the stock error asterisk.
 */
export const StepDrawerTabsRenderer = createReactiveComponent(function StepDrawerTabsRenderer({
    node
}: TabsNodeRendererProps) {
    const options = useStepFormOptions();
    // The rule cards' live and server errors count on the Assignment tab, shown without a Save.
    const ruleErrorCount = countRuleErrors(options.ruleErrors.items, options.ruleIssues.items);
    const countTabErrors = (tab: TabsNodeRendererProps["node"]["tabs"][number]): number => {
        let count = countLayoutErrors(tab.layout);
        if (tab.id === PEOPLE_TAB.assignment) {
            count += ruleErrorCount;
        }
        return count;
    };

    return (
        <Tabs
            value={node.activeTabId}
            onValueChange={id => node.setActiveTab(id)}
            tabs={node.tabs.map(tab => (
                <Tabs.Tab
                    key={tab.id}
                    value={tab.id}
                    trigger={
                        <StepDrawerTabLabel label={tab.label} errorCount={countTabErrors(tab)} />
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

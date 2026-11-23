import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { Drawer } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin";
import { useLayoutRenderers } from "@webiny/app-admin";
import type { LayoutRenderers } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import { SwitchAutomationDialog } from "~/editor/presentation/stepForm/components/SwitchAutomationDialog.js";
import { PEOPLE_TAB } from "~/editor/presentation/stepForm/peopleTabs.js";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepDrawerSource } from "./abstractions.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { getActiveTabId } from "./getActiveTabId.js";
import { getStepLevelWarnings } from "./getStepLevelWarnings.js";
import { StepDrawerBanners } from "./StepDrawerBanners.js";
import { StepDrawerTabsRenderer } from "./StepDrawerTabsRenderer.js";
import { StepDrawerWarnings } from "./StepDrawerWarnings.js";

export interface StepDrawerProps {
    // The editor presenter (R284).
    source: StepDrawerSource;
    // `vm.openStepId` of the editor: the drawer opens for it and closes when it is null.
    stepId: string | null;
}

/*
 * The step drawer (design README 4, R284): 560px, over the editor. An effect opens it for the
 * editor's `openStepId` and closes it when that is null. Closing it itself (Done, the X, Escape, the
 * scrim) applies the edits to the unsaved workflow and tells the editor through `source.closeStep()`;
 * only the page-level Save persists anything (D92).
 */
export const StepDrawer = createReactiveComponent(function StepDrawer(props: StepDrawerProps) {
    const { source, stepId } = props;
    const { presenter } = useFeature(StepDrawerPresenterFeature);
    const defaultLayoutRenderers = useLayoutRenderers();
    // The form's tabs show their field error counts (B23); every other layout keeps its renderer.
    const layoutRenderers = useMemo((): LayoutRenderers => {
        return { ...defaultLayoutRenderers, [STEP_FORM_RENDERER.stepTabs]: StepDrawerTabsRenderer };
    }, [defaultLayoutRenderers]);

    useEffect(() => {
        if (stepId === null) {
            presenter.close();
            return;
        }
        presenter.open(source, stepId);
    }, [presenter, source, stepId]);

    useEffect(() => {
        return () => {
            presenter.dispose();
        };
    }, [presenter]);

    const { vm } = presenter;

    if (!vm.open) {
        return null;
    }

    const formOptions = buildStepFormOptions(vm, presenter);
    const activeTabId = getActiveTabId(vm.form);

    // The step's own warnings (team warnings) end the Assignment tab, after its last field.
    let tabWarnings: React.ReactNode = null;
    if (activeTabId === PEOPLE_TAB.assignment) {
        tabWarnings = <StepDrawerWarnings warnings={getStepLevelWarnings(vm.warnings)} />;
    }

    return (
        <StepFormOptionsContext.Provider value={formOptions}>
            <Drawer
                open
                modal
                width={"560px"}
                title={vm.title}
                description={vm.subtitle}
                bodyPadding
                headerSeparator
                footerSeparator
                onClose={() => presenter.dismiss()}
                info={<Text size={"sm"}>{vm.footerText}</Text>}
                actions={
                    <Drawer.ConfirmButton
                        text={vm.doneLabel}
                        onClick={() => {
                            void presenter.done();
                        }}
                    />
                }
            >
                <div
                    data-testid={"step-drawer-body"}
                    className={cn("flex flex-col gap-md", activeTabId === null && "pt-md")}
                >
                    <StepDrawerBanners
                        licenceAlert={vm.licenceAlert}
                        notice={vm.notice}
                        topError={vm.topError}
                        errorTab={vm.errorTab}
                        activeTabId={activeTabId}
                        onShowErrorTab={() => presenter.showErrorTab()}
                    />
                    {vm.form && (
                        <FormView
                            name={"Workflow step"}
                            form={vm.form}
                            layoutRenderers={layoutRenderers}
                        />
                    )}
                    {tabWarnings}
                </div>
                {vm.switchConfirmation && (
                    <SwitchAutomationDialog
                        confirmation={vm.switchConfirmation}
                        onConfirm={() => presenter.confirmSwitch()}
                        onCancel={() => presenter.cancelSwitch()}
                    />
                )}
            </Drawer>
        </StepFormOptionsContext.Provider>
    );
});

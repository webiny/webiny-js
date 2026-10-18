import React from "react";
import { useEffect } from "react";
import { Drawer } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import { SwitchAutomationDialog } from "~/editor/presentation/stepForm/components/SwitchAutomationDialog.js";
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { getActiveTabId } from "./getActiveTabId.js";
import { StepDrawerBanners } from "./StepDrawerBanners.js";

export interface StepDrawerProps {
    // The editor presenter (R284).
    source: StepDrawerSource;
    // `vm.openStepId` of the editor: the drawer opens for it and closes when it is null.
    stepId: string | null;
}

interface StepTypeTileProps {
    kind: StepKind;
}

const KIND_ICONS = {
    review: <GroupIcon />,
    automation: <BoltIcon />,
    ai: <AutoAwesomeIcon />,
    unknown: <RateReviewIcon />
};

// The neutral 36px tile of the header (design README 4): the type's icon.
const StepTypeTile = ({ kind }: StepTypeTileProps) => {
    return (
        <span
            className={
                "flex size-9 shrink-0 items-center justify-center rounded bg-neutral-dimmed text-neutral-strong"
            }
        >
            {KIND_ICONS[kind]}
        </span>
    );
};

/*
 * The step drawer (design README 4, R284): 560px, over the editor. An effect opens it for the
 * editor's `openStepId` and closes it when that is null. Closing it itself (Done, the X, Escape, the
 * scrim) applies the edits to the unsaved workflow and tells the editor through `source.closeStep()`;
 * only the page-level Save persists anything (D92).
 */
export const StepDrawer = createReactiveComponent(function StepDrawer(props: StepDrawerProps) {
    const { source, stepId } = props;
    const { presenter } = useFeature(StepDrawerPresenterFeature);

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

    return (
        <StepFormOptionsContext.Provider value={formOptions}>
            <Drawer
                open
                modal
                width={"560px"}
                title={
                    <div className={"flex flex-col"}>
                        <Text size={"sm"} className={"font-normal text-neutral-strong"}>
                            {vm.subtitle}
                        </Text>
                        <span>{vm.title}</span>
                    </div>
                }
                icon={<StepTypeTile kind={vm.kind} />}
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
                <div className={"flex flex-col gap-md"}>
                    <StepDrawerBanners
                        licenceAlert={vm.licenceAlert}
                        notice={vm.notice}
                        topError={vm.topError}
                        errorTab={vm.errorTab}
                        warnings={vm.warnings}
                        activeTabId={activeTabId}
                        onShowErrorTab={() => presenter.showErrorTab()}
                    />
                    {vm.form && <FormView name={"Workflow step"} form={vm.form} />}
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

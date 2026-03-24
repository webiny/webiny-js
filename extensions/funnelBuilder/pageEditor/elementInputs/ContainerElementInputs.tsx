import React from "react";
import { Button, useDisclosure } from "webiny/admin/ui";
import { ElementInputs, useElementInputs } from "webiny/admin/website-builder/page/editor";
import { ConditionRulesDialog } from "../components/ConditionRulesDialog";
import { StepsList } from "../stepper/StepsList.js";
import type { FunnelModelDto } from "../../models/FunnelModel";
import type { FunnelContainerInputs } from "../types";

export const ContainerElementInputsDecorator = ElementInputs.createDecorator(Original => {
    return function ContainerElementSettings(props) {
        const { element } = props;
        const { inputs, updateInputs } = useElementInputs(element.id);

        const {
            open: showConditionRulesDialog,
            close: hideConditionRulesDialog,
            isOpen: isConditionRulesDialogOpen,
            data: conditionRulesData
        } = useDisclosure<FunnelModelDto>();

        if (element.component.name !== "Fub/Container") {
            return <Original {...props} />;
        }

        /* Container element: open condition rules using the current containerData. */
        const handleClick = () => {
            const { containerData } = inputs as unknown as FunnelContainerInputs;
            showConditionRulesDialog(containerData);
        };

        const handleSubmit = (data: FunnelModelDto) => {
            updateInputs(current => {
                (current as unknown as FunnelContainerInputs).containerData = data;
            });
            hideConditionRulesDialog();
        };

        return (
            <>
                <StepsList />
                <Button
                    variant={"primary"}
                    text={"Edit Condition Rules"}
                    className={"w-full"}
                    onClick={handleClick}
                />
                <ConditionRulesDialog
                    open={isConditionRulesDialogOpen}
                    data={conditionRulesData!}
                    onClose={hideConditionRulesDialog}
                    onSubmit={handleSubmit}
                />
            </>
        );
    };
});

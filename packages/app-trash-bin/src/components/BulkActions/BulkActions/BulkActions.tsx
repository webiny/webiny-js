import React, { useMemo } from "react";
import { ReactComponent as Close } from "@material-design-icons/svg/outlined/close.svg";
import { Buttons } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { useTrashBinListConfig } from "~/configs";
import { useTrashBin } from "~/hooks";
import { BulkActionsContainer, BulkActionsInner, ButtonsContainer } from "./BulkActions.styled";

export const getEntriesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "item" : "items"}`;
};

export const BulkActions = () => {
    const { browser } = useTrashBinListConfig();
    const { presenter, controllers } = useTrashBin();

    const headline = useMemo((): string => {
        return getEntriesLabel(presenter.vm.selectedEntries.length) + ` selected:`;
    }, [presenter.vm.selectedEntries]);

    if (!presenter.vm.selectedEntries.length) {
        return null;
    }

    return (
        <BulkActionsContainer>
            <BulkActionsInner>
                <ButtonsContainer>
                    <Typography use={"headline6"}>{headline}</Typography>
                    <Buttons actions={browser.bulkActions} />
                </ButtonsContainer>
                <IconButton
                    icon={<Close />}
                    onClick={() => controllers.selectEntries.execute([])}
                />
            </BulkActionsInner>
        </BulkActionsContainer>
    );
};

import React, { useMemo } from "react";
import { ReactComponent as Close } from "@material-design-icons/svg/outlined/close.svg";
import { Buttons } from "@webiny/app-admin";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { useTrashBinListConfig } from "~/Presentation/configs";
import { useTrashBin } from "~/Presentation/hooks";
import { BulkActionsContainer, BulkActionsInner, ButtonsContainer } from "./BulkActions.styled";

export const getEntriesLabel = (count = 0): string => {
    return `${count} ${count === 1 ? "item" : "items"}`;
};

export const BulkActions = () => {
    const { browser } = useTrashBinListConfig();
    const { vm, selectItems } = useTrashBin();

    const headline = useMemo((): string => {
        return getEntriesLabel(vm.selectedItems.length) + ` selected:`;
    }, [vm.selectedItems]);

    if (!vm.selectedItems.length) {
        return null;
    }

    return (
        <BulkActionsContainer>
            <BulkActionsInner>
                <ButtonsContainer>
                    <Typography use={"headline6"}>{headline}</Typography>
                    <Buttons actions={browser.bulkActions} />
                </ButtonsContainer>
                <IconButton icon={<Close />} onClick={() => selectItems.execute([])} />
            </BulkActionsInner>
        </BulkActionsContainer>
    );
};

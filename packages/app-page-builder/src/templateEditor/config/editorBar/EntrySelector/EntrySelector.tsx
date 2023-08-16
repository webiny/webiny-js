import React, { useState, useCallback } from "react";

import { Icon } from "@webiny/ui/Icon";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { ReactComponent as OpenIcon } from "@material-design-icons/svg/round/open_in_new.svg";

import { EditorBar } from "~/editor";
import { useSourceModel } from "~/templateEditor/hooks/useSourceModel";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { EntrySelectorModal } from "./EntrySelectorModal";
import {
    EntrySelectorWrapper,
    SelectEntry,
    SelectedEntryTitle,
    SelectedEntryLable,
    SelectedEntryLeft,
    SelectedEntryRight
} from "./styles";

const DefaultEntrySelector = () => {
    const [sourceModel] = useSourceModel();
    const [toggleModal, setToggleModal] = useState<boolean>(false);
    const [templateAtomValue] = useTemplate();

    const onClose = useCallback(() => {
        setToggleModal(false);
    }, []);

    return (
        <EntrySelectorWrapper>
            <SelectEntry onClick={() => setToggleModal(true)}>
                <SelectedEntryLeft>
                    <SelectedEntryLable>Preview entry:</SelectedEntryLable>
                    <SelectedEntryTitle>
                        {templateAtomValue.dynamicSource?.entryId || "Select Entry"}
                    </SelectedEntryTitle>
                </SelectedEntryLeft>
                <SelectedEntryRight>
                    <Icon icon={<OpenIcon width={24} height={24} color="#717171" />} />
                </SelectedEntryRight>
            </SelectEntry>
            {sourceModel.data && toggleModal && (
                <EntrySelectorModal sourceModel={sourceModel.data} onClose={onClose} />
            )}
        </EntrySelectorWrapper>
    );
};

const EntrySelector = makeComposable("EntrySelector", DefaultEntrySelector);

export const EntrySelectorPlugin = createComponentPlugin(EditorBar.CenterSection, CenterSection => {
    return function AddEntrySelect(props) {
        return (
            <CenterSection>
                {props.children}
                <EntrySelector />
            </CenterSection>
        );
    };
});

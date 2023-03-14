import React, { useCallback } from "react";
import styled from "@emotion/styled";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { Image } from "./entry/Image";
import { ModelName } from "./entry/ModelName";
import { Title } from "./entry/Title";
import { Description } from "./entry/Description";
import { Status } from "./entry/Status";
import { CreatedBy } from "./entry/CreatedBy";
import { ModifiedBy } from "./entry/ModifiedBy";
import { View } from "./entry/View";
import { Select } from "./entry/Select";
import { Remove } from "./entry/Remove";
import { MoveUp } from "./entry/MoveUp";
import { MoveDown } from "./entry/MoveDown";

const Container = styled("div")({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)",
    marginBottom: "10px",
    boxSizing: "border-box"
});

const ContentContainer = styled("div")({
    width: "100%",
    display: "grid",
    gridTemplateColumns: "166px auto",
    borderBottom: "1px solid var(--mdc-theme-background)"
});

const Content = styled("div")({
    paddingLeft: "16px",
    paddingTop: "18px",
    paddingBottom: "10px"
});

const FooterContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    padding: "10px"
});

interface Props {
    entry: CmsReferenceContentEntry;
    onChange: (value: CmsReferenceValue) => void;
    index?: never;
    selected: boolean;
    onMoveUp?: never;
    onMoveDown?: never;
    onRemove?: never;
}

interface PropsWithRemove {
    onRemove: (entryId: string) => void;
    entry: CmsReferenceContentEntry;
    index: number;
    onMoveUp?: (index: number, toTop: boolean) => void;
    onMoveDown?: (index: number, toBottom: boolean) => void;
    onChange?: never;
    selected?: never;
}

export const Entry: React.VFC<PropsWithRemove | Props> = ({
    entry,
    onChange,
    onRemove,
    selected,
    index,
    onMoveUp: onMoveUpClick,
    onMoveDown: onMoveDownClick
}) => {
    const onMoveUp = useCallback(
        (ev: React.MouseEvent) => {
            if (!onMoveUpClick) {
                return;
            }
            onMoveUpClick(index, ev.shiftKey);
        },
        [onMoveUpClick, index]
    );
    const onMoveDown = useCallback(
        (ev: React.MouseEvent) => {
            if (!onMoveDownClick) {
                return;
            }
            onMoveDownClick(index, ev.shiftKey);
        },
        [onMoveDownClick, index]
    );

    return (
        <Container>
            <ContentContainer>
                <Image title={entry.title} src={entry.image} />
                <Content>
                    <ModelName name={entry.model.name} />
                    <Title title={entry.title} />
                    <Description description={entry.description} />
                </Content>
            </ContentContainer>
            <FooterContainer>
                <Status status={entry.status} />
                <CreatedBy createdBy={entry.createdBy} createdOn={entry.createdOn} />
                <ModifiedBy modifiedBy={entry.modifiedBy} savedOn={entry.savedOn} />
                {onMoveUpClick && <MoveUp onClick={onMoveUp} />}
                {onMoveDownClick && <MoveDown onClick={onMoveDown} />}
                <View entry={entry} />
                {onChange && <Select entry={entry} onChange={onChange} selected={selected} />}
                {onRemove && <Remove entry={entry} onRemove={onRemove} />}
            </FooterContainer>
        </Container>
    );
};

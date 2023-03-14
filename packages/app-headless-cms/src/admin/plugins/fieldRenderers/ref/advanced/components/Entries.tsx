import React, { useCallback } from "react";
import debounce from "lodash/debounce";
import styled from "@emotion/styled";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { positionValues as PositionValues } from "react-custom-scrollbars";

interface ContainerProps {
    height?: `${number}px` | `${number}%` | `${number}vh`;
}

const Container = styled("div")(({ height }: ContainerProps) => {
    return {
        minWidth: "100%",
        height: height || "460px",
        maxHeight: 460,
        backgroundColor: "var(--mdc-theme-background)",
        boxSizing: "border-box",
        '>div':{
            marginRight: 20
        }
    };
});
const ContainerChild = styled("div")({
    boxSizing: "border-box",
    width: "100%",
    margin: '0 2px 25px 2px'
});

interface Props {
    entries: CmsReferenceContentEntry[];
    children: (entry: CmsReferenceContentEntry, index: number) => React.ReactNode;
    loadMore: () => void;
}

export const Entries: React.VFC<Props> = props => {
    const { entries, children, loadMore } = props;

    const loadMoreOnScroll = useCallback(
        debounce((position: PositionValues) => {
            if (position.top <= 0.9) {
                return;
            }
            loadMore();
        }, 500),
        [entries, loadMore]
    );

    if (entries.length === 0) {
        return null;
    }
    return (
        <Container>
            <Scrollbar data-testid="advanced-ref-field-entries" onScrollFrame={loadMoreOnScroll}>
                {entries.map((entry, index) => {
                    return (
                        <ContainerChild key={`entry-${entry.id}`}>
                            {children(entry, index)}
                        </ContainerChild>
                    );
                })}
            </Scrollbar>
        </Container>
    );
};

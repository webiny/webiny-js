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
        height: height || "500px",
        backgroundColor: "var(--mdc-theme-background)",
        // padding: "20px",
        boxSizing: "border-box"
    };
});
const ContainerChild = styled("div")({
    padding: "20px",
    boxSizing: "border-box",
    width: "100%"
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

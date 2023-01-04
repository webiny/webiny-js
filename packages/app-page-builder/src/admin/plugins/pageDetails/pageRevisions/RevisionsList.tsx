import React from "react";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import Revision from "./Revision";
import { PbPageData } from "~/types";
import { QueryResult } from "@apollo/react-common";
import styled from "@emotion/styled";

const Container = styled("div")`
    background: var(--mdc-theme-background);
    padding: 25px;
    height: calc(100vh - 48px);
`;

const Wrapper = styled(Elevation)`
    display: flex;
    flex-direction: column;
    overflow: auto;
    max-height: calc(100vh - 100px);

    .mdc-list .mdc-list-item {
        border-bottom: 1px solid var(--mdc-theme-on-background);
    }

    .mdc-list .mdc-list-item:last-child {
        border-bottom: none;
    }
`;

interface RevisionsListProps {
    page: PbPageData;
    getPageQuery: QueryResult;
}
const RevisionsList: React.FC<RevisionsListProps> = props => {
    const { page, getPageQuery } = props;
    const { revisions = [] } = page;

    return (
        <Container>
            <Wrapper z={2}>
                <div style={{ position: "relative" }}>
                    {getPageQuery.loading && <CircularProgress />}
                    <List nonInteractive twoLine>
                        {revisions.map(revision => (
                            <Revision {...props} revision={revision} key={revision.id} />
                        ))}
                    </List>
                </div>
            </Wrapper>
        </Container>
    );
};

export default RevisionsList;

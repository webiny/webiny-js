import React from "react";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { Revision } from "./Revision";
import { PbPageData, PbPageRevision } from "~/types";
import { QueryResult } from "@apollo/react-common";
import styled from "@emotion/styled";
import { createGenericContext } from "@webiny/app-admin";

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

    .mdc-deprecated-list .mdc-deprecated-list-item {
        border-bottom: 1px solid var(--mdc-theme-on-background);
    }

    .mdc-deprecated-list .mdc-deprecated-list-item:last-child {
        border-bottom: none;
    }
`;

export interface RevisionContext {
    revision: PbPageRevision;
}

const { Provider, useHook } = createGenericContext<RevisionContext>("RevisionContext");

interface RevisionsListProps {
    page: PbPageData;
    getPageQuery: QueryResult;
}
const RevisionsList = (props: RevisionsListProps) => {
    const { page, getPageQuery } = props;
    const { revisions = [] } = page;

    return (
        <Container>
            <Wrapper z={2}>
                <div style={{ position: "relative" }}>
                    {getPageQuery.loading && <CircularProgress />}
                    <List nonInteractive twoLine>
                        {revisions.map(revision => (
                            <Provider revision={revision} key={revision.id}>
                                <Revision />
                            </Provider>
                        ))}
                    </List>
                </div>
            </Wrapper>
        </Container>
    );
};

export const useRevision = useHook;

export default RevisionsList;

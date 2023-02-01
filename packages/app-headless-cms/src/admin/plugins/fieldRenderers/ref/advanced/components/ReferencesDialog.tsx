import React, { useState } from "react";
import styled from "@emotion/styled";
import { Header } from "./Header";
import { Search } from "./Search";
import { Loading } from "./Loading";
import { Entry } from "./Entry";
import { Dialog } from "~/admin/components/Dialog";
import { CmsEditorFieldRendererProps } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";

const Container = styled("div")({
    width: "100%",
    padding: "20px"
});

const Content = styled("div")({
    display: "flex",
    flex: "1",
    flexDirection: "column",
    position: "relative",
    width: "100%",
    minHeight: "100px"
});

export const ReferencesDialog: React.FC<CmsEditorFieldRendererProps> = props => {
    const { contentModel } = props;

    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const onCloseClick = () => {
        return false;
    };
    return (
        <Dialog>
            <Container>
                <Header model={contentModel} onCloseClick={onCloseClick} />
                <Search model={contentModel} setEntries={setEntries} setLoading={setLoading} />
                <Content>
                    {loading && <Loading />}
                    {entries.map(entry => {
                        return <Entry key={`entry-${entry.id}`} entry={entry} />;
                    })}
                </Content>
            </Container>
        </Dialog>
    );
};

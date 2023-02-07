import React, { useState } from "react";
import styled from "@emotion/styled";
import { Header } from "./Header";
import { Search } from "./Search";
import { Loading } from "./Loading";
import { Entry } from "./Entry";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "~/admin/components/Dialog";
import { CmsEditorFieldRendererProps } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

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

interface Props extends CmsEditorFieldRendererProps {
    onDialogClose: () => void;
}
export const ReferencesDialog: React.FC<Props> = props => {
    const { contentModel, onDialogClose } = props;

    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    return (
        <Dialog open={true} onClose={onDialogClose}>
            <DialogTitle>Select an existing record</DialogTitle>
            <DialogContent>
                <Container>
                    <Search model={contentModel} setEntries={setEntries} setLoading={setLoading} />
                    <Content>
                        {loading && <Loading />}
                        {entries.map(entry => {
                            return <Entry key={`entry-${entry.id}`} entry={entry} />;
                        })}
                    </Content>
                </Container>
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={onDialogClose}>Cancel</ButtonDefault>
                <ButtonPrimary onClick={onDialogClose}>Save Field</ButtonPrimary>
            </DialogActions>
        </Dialog>
    );
};

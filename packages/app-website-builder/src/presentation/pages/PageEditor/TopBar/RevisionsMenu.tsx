import React, { useState, useEffect, useCallback } from "react";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { ReactComponent as ArrowDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as Draft } from "@webiny/icons/draw.svg";
import { ReactComponent as Unpublished } from "@webiny/icons/lock.svg";
import { ReactComponent as Published } from "@webiny/icons/remove_red_eye.svg";
import { useGetPageRevisions } from "~/features/pages/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { useRouter } from "@webiny/app-admin";
import { Routes } from "~/routes.js";
import { usePageEditorDrawer } from "~/presentation/pages/PageEditor/Revisions/usePageEditorDrawer.js";

const { Item } = DropdownMenu;

const statusIcon: Record<string, React.JSX.Element> = {
    draft: <Draft />,
    published: <Published />,
    unpublished: <Unpublished />
};

export const RevisionsMenu = () => {
    const { getLink } = useRouter();
    const [revisions, setRevisions] = useState<PageRevision[]>([]);
    const { loading, getPageRevisions } = useGetPageRevisions();
    const id = useSelectFromDocument(document => document.id);
    const status = useSelectFromDocument<string, EditorPage>(document => document.status);

    const { openRevisionList } = usePageEditorDrawer();

    useEffect(() => {
        const [entryId] = id.split("#");
        getPageRevisions({ entryId }).then(revisions => {
            setRevisions(
                revisions
                    .sort((a, b) => {
                        return new Date(a.savedOn).getTime() - new Date(b.savedOn).getTime();
                    })
                    .reverse()
            );
        });
    }, [id, status]);

    const currentRevision = revisions.find(r => r.id === id);

    const goToRevision = useCallback((id: string) => {
        // TODO: make this work without a full app reload
        window.location.pathname = getLink(Routes.Pages.Editor, { id });
    }, []);

    const onOpenRevisionList = useCallback(() => {
        openRevisionList(true);
    }, []);

    return (
        <DropdownMenu
            trigger={
                <Button
                    disabled={loading}
                    variant="ghost"
                    text={currentRevision ? currentRevision.getLabel() : "Loading..."}
                    icon={<ArrowDown />}
                    iconPosition={"end"}
                />
            }
        >
            {revisions.slice(0, 5).map(revision => (
                <Item
                    key={revision.id}
                    className={"cursor-pointer"}
                    onClick={() => goToRevision(revision.id)}
                    icon={
                        <Item.Icon
                            label={revision.getLabel()}
                            element={statusIcon[revision.status]}
                        />
                    }
                    text={<Text size={"sm"}>{revision.getLabel()}</Text>}
                />
            ))}
            {revisions.length > 5 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        key={"revisions-all"}
                        onClick={onOpenRevisionList}
                        text={
                            <>
                                <Text size={"sm"}>Show All Revisions</Text>
                            </>
                        }
                    />
                </>
            ) : null}
        </DropdownMenu>
    );
};

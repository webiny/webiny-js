import React, { useCallback } from "react";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { ReactComponent as ArrowDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as Draft } from "@webiny/icons/draw.svg";
import { ReactComponent as Unpublished } from "@webiny/icons/lock.svg";
import { ReactComponent as Published } from "@webiny/icons/remove_red_eye.svg";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { useRevisionList } from "~/presentation/pages/PageEditor/Revisions/useRevisionList.js";
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
    const id = useSelectFromDocument(document => document.id);

    const { openRevisionList } = usePageEditorDrawer();

    // Shares the presenter with the revisions drawer, so mutations made there are reflected here.
    const { vm } = useRevisionList(id);
    const { revisions, isLoading } = vm;

    const currentRevision = revisions.find(item => item.revision.id === id)?.revision;

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
                    disabled={isLoading}
                    variant="ghost"
                    text={currentRevision ? currentRevision.getLabel() : "Loading..."}
                    icon={<ArrowDown />}
                    iconPosition={"end"}
                />
            }
        >
            {revisions.slice(0, 5).map(({ revision }) => (
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
        </DropdownMenu>
    );
};

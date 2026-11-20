import React from "react";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import { ReactComponent as ArrowDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as Draft } from "@webiny/icons/draw.svg";
import { ReactComponent as Unpublished } from "@webiny/icons/lock.svg";
import { ReactComponent as Published } from "@webiny/icons/remove_red_eye.svg";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { Routes } from "~/routes.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";
import { getRevisionLabel } from "../Revisions/LayoutRevisionsPresenter.js";
import { useLayoutRevisions } from "../Revisions/useLayoutRevisions.js";

const { Item } = DropdownMenu;

const statusIcon: Record<string, React.JSX.Element> = {
    draft: <Draft />,
    published: <Published />,
    unpublished: <Unpublished />
};

/**
 * The open revision, and the layout's other revisions to open instead.
 */
export const RevisionsMenu = createReactiveComponent(() => {
    const { goToRoute } = useRouter();
    const presenter = useLayoutRevisions();
    const current = useSelectFromDocument<
        Pick<LayoutEditorDocument, "id" | "version" | "status">,
        LayoutEditorDocument
    >(document => ({ id: document.id, version: document.version, status: document.status }));

    const { revisions, loading } = presenter.vm;

    return (
        <DropdownMenu
            trigger={
                <Button
                    disabled={loading}
                    variant={"ghost"}
                    text={getRevisionLabel(current)}
                    icon={<ArrowDown />}
                    iconPosition={"end"}
                />
            }
        >
            {revisions.map(({ revision, label }) => (
                <Item
                    key={revision.id}
                    className={"cursor-pointer"}
                    onClick={() => goToRoute(Routes.Layouts.Editor, { id: revision.id })}
                    icon={<Item.Icon label={label} element={statusIcon[revision.status]} />}
                    text={
                        <Text
                            size={"sm"}
                            className={revision.id === current.id ? "font-semibold" : undefined}
                        >
                            {label}
                        </Text>
                    }
                />
            ))}
            <DropdownMenu.Separator />
            <Item
                key={"revisions-all"}
                onClick={() => presenter.openDrawer(true)}
                text={<Text size={"sm"}>Show All Revisions</Text>}
            />
        </DropdownMenu>
    );
});

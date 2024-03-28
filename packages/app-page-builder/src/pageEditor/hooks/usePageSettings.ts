import { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { pageSettingsStateAtom } from "~/pageEditor/config/editorBar/PageSettings/state";
import { usePage } from "~/pageEditor/hooks/usePage";
import { UpdatedPage } from "~/pageEditor/config/eventActions/saveRevision/types";
import { PbPageData } from "~/types";

export type UsePageSettings = ReturnType<typeof usePageSettings>;

export function usePageSettings() {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const eventActionHandler = useEventActionHandler();
    const [pageData, setPageData] = usePage();
    const [, setSettingsState] = useRecoilState(pageSettingsStateAtom);

    const { showSnackbar } = useSnackbar();
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();

    const closeSettings = useCallback(() => {
        setSettingsState(false);
    }, []);

    const savePage = useCallback((pageValue: Partial<PbPageData>) => {
        eventActionHandler.trigger(
            new UpdateDocumentActionEvent({
                document: pageValue,
                debounce: false,
                history: false,
                onFinish: (page?: UpdatedPage) => {
                    showSnackbar("Settings saved!");
                    closeSettings();
                    if (page) {
                        setPageData(state => ({ ...state, ...page }));
                    }
                }
            })
        );
    }, []);

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            closeSettings();
        });

        return () => removeKeyHandler("escape");
    });

    return { setActiveSection, activeSection, savePage, closeSettings, pageData };
}

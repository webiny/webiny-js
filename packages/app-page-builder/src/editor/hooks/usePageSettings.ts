import { useCallback, useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { pageAtom } from "~/editor/recoil/modules";
import { useKeyHandler } from "~/editor/hooks/useKeyHandler";
import {
    DeactivatePluginActionEvent,
    UpdatePageRevisionActionEvent
} from "~/editor/recoil/actions";

export type UsePageSettings = ReturnType<typeof usePageSettings>;

export function usePageSettings() {
    const [activeSection, setActiveSection] = useState<string>(null);
    const eventActionHandler = useEventActionHandler();
    const pageData = useRecoilValue(pageAtom);

    const { showSnackbar } = useSnackbar();
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();

    const closeSettings = useCallback(() => {
        eventActionHandler.trigger(
            new DeactivatePluginActionEvent({
                name: "pb-editor-page-settings-bar"
            })
        );
    }, []);

    const savePage = useCallback(pageValue => {
        eventActionHandler.trigger(
            new UpdatePageRevisionActionEvent({
                debounce: false,
                page: pageValue,
                onFinish: () => {
                    showSnackbar("Settings saved!");
                    closeSettings();
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

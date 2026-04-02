import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { CommandPalette as CommandPaletteUi } from "@webiny/admin-ui";
import { useHotkeys } from "~/hooks/useHotkeys.js";
import { CommandPaletteFeature } from "~/presentation/commandPalette/feature.js";

export const CommandPalette = observer(() => {
    const { presenter } = useFeature(CommandPaletteFeature);
    const { vm } = presenter;

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const keys = useMemo(() => {
        return {
            "mod+k": (e: KeyboardEvent) => {
                e.preventDefault();
                presenter.toggle();
            },
            backspace: (e: KeyboardEvent) => {
                if (e.target instanceof HTMLInputElement) {
                    return;
                }
                e.preventDefault();
                presenter.cancelCommand();
            },
            ...presenter.shortcutKeys
        };
    }, [presenter, presenter.shortcutKeys]);

    useHotkeys({
        zIndex: 100,
        keys
    });

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (nextOpen) {
                presenter.open();
            } else {
                presenter.close();
            }
        },
        [presenter]
    );

    const activeCommand = vm.activeCommand;
    const detailView = activeCommand
        ? {
              label: activeCommand.command.label,
              icon: activeCommand.command.icon,
              element: (
                  <activeCommand.DetailView
                      command={activeCommand.command}
                      onClose={() => presenter.close()}
                      onBack={() => presenter.cancelCommand()}
                  />
              )
          }
        : undefined;

    return (
        <CommandPaletteUi
            open={vm.isOpen}
            onOpenChange={handleOpenChange}
            commands={vm.commands}
            detailView={detailView}
            onSelectCommand={name => presenter.useCommand(name)}
            onCancelCommand={() => presenter.cancelCommand()}
        />
    );
});

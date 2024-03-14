import React, { useState, useCallback } from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { Bin } from "~/components";
import { IBinRepository } from "~/abstractions";

interface BinButtonProps {
    repository: IBinRepository<any>;
}

export const BinButton = (props: BinButtonProps) => {
    const [opened, setOpened] = useState<boolean>(false);
    const open = useCallback((): void => setOpened(true), []);
    const close = useCallback((): void => setOpened(false), []);

    return (
        <>
            <ButtonDefault onClick={open}>{"Open bin"}</ButtonDefault>
            {opened && <Bin onExited={close} repository={props.repository} />}
        </>
    );
};

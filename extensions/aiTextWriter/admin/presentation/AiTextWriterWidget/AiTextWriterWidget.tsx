import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Widget } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app-admin";
import { ReactComponent as WriterIcon } from "@webiny/icons/mark_unread_chat_alt.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { AiTextWriterWidgetFeature } from "./feature.js";

export const AiTextWriterWidget = observer(() => {
    const { presenter } = useFeature(AiTextWriterWidgetFeature);

    const vm = presenter.vm;

    return (
        <Widget
            variant="accent"
            title={vm.title}
            icon={<Widget.Icon icon={<WriterIcon />} label={"AI Text Writer"} />}
            padding="md"
            footerStartActions={
                <Widget.Action
                    icon={<AddIcon />}
                    onClick={() => presenter.loadData()}
                    disabled={vm.loading}
                >
                    {vm.loading ? <>Writing...</> : <>Write Something</>}
                </Widget.Action>
            }
        >
            {vm.message}
        </Widget>
    );
});

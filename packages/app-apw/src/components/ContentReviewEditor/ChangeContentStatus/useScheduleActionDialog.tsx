import React, { useState, useContext, createContext } from "react";

const ScheduleActionDialogContext = createContext<ScheduleActionDialogContextValue>(
    {} as ScheduleActionDialogContextValue
);

export type ScheduleActionType = "publish" | "unpublish";

export interface ScheduleActionDialogContextValue {
    action: ScheduleActionType;
    setAction: (value: ScheduleActionType) => void;
    openPublishNowDialog: boolean;
    setOpenPublishNowDialog: (value: boolean) => void;
    openPublishLaterDialog: boolean;
    setOpenPublishLaterDialog: (value: boolean) => void;
}

export const useScheduleActionDialog = (): ScheduleActionDialogContextValue => {
    return useContext(ScheduleActionDialogContext);
};

export const ScheduleActionDialogProvider: React.FC = ({ children }) => {
    const [action, setAction] = useState<ScheduleActionType>("publish");
    const [openPublishNowDialog, setOpenPublishNowDialog] = useState<boolean>(false);
    const [openPublishLaterDialog, setOpenPublishLaterDialog] = useState<boolean>(false);

    return (
        <ScheduleActionDialogContext.Provider
            value={{
                action,
                setAction,
                openPublishLaterDialog,
                setOpenPublishLaterDialog,
                openPublishNowDialog,
                setOpenPublishNowDialog
            }}
        >
            {children}
        </ScheduleActionDialogContext.Provider>
    );
};

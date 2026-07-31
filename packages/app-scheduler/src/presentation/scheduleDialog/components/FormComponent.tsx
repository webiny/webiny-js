import React from "react";
import { observer } from "mobx-react-lite";
import { Grid } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { IScheduleDialogPresenter } from "../abstractions.js";
import { minDateValidator } from "../minDateValidator.js";
import { ReschedulingAlert } from "./ReschedulingAlert.js";
import { SchedulerDialogFormComponentDateTimeInput } from "./SchedulerDialogFormComponentDateTimeInput.js";

interface FormComponentProps {
    presenter: IScheduleDialogPresenter;
}

export const FormComponent = observer(({ presenter }: FormComponentProps) => {
    const { entry } = presenter.vm;
    const scheduleOn = entry?.publishOn || entry?.unpublishOn;
    const actionType = entry?.actionType;

    return (
        <>
            <ReschedulingAlert actionType={actionType} scheduleOn={scheduleOn} />
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        name={"scheduleOn"}
                        validators={[validation.create("required"), minDateValidator]}
                    >
                        {bind => {
                            return <SchedulerDialogFormComponentDateTimeInput bind={bind} />;
                        }}
                    </Bind>
                </Grid.Column>
            </Grid>
        </>
    );
});

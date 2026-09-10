import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Grid } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { IScheduleDialogPresenter } from "../abstractions.js";
import { createMinDateValidator } from "../createMinDateValidator.js";
import { useDateFormatter } from "@webiny/app-admin";
import { ReschedulingAlert } from "./ReschedulingAlert.js";
import { SchedulerDialogFormComponentDateTimeInput } from "./SchedulerDialogFormComponentDateTimeInput.js";

interface FormComponentProps {
    presenter: IScheduleDialogPresenter;
}

export const FormComponent = observer(({ presenter }: FormComponentProps) => {
    const { rescheduling } = presenter.vm;
    const dateFormatter = useDateFormatter();
    const minDateValidator = useMemo(() => createMinDateValidator(dateFormatter), [dateFormatter]);

    return (
        <>
            <ReschedulingAlert rescheduling={rescheduling} />
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

import React, {useEffect, useState} from "react";
import {Typography} from "@webiny/ui/Typography";
import {Input} from "@webiny/ui/Input";
import {css} from "emotion";
import {i18n} from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/environments/data-list-utils");

const messageStyle = css ({
    'span': {
        display: 'inline-block',
        marginBottom: 16
    }
});

const environmentStyle = css ({
    color: 'var(--mdc-theme-primary)'
});

const inputStyles = css ({
    margin: '16px 0px'
});

export const ConfirmationMessage = ({itemName, disableConfirm, setDisableConfirm}) => {
    const [name, setName] = useState("");

    useEffect(() => {
        if (disableConfirm && name === itemName) {
            setDisableConfirm(false);
        } else {
            setDisableConfirm(true);
        }
    }, [itemName, name])

    return (
        <div className={messageStyle}>
            <Typography use={"body1"}>{t`You are about to remove the`}</Typography>&nbsp;
            <Typography use={"body1"} className={environmentStyle}>{itemName}</Typography>&nbsp;
            <Typography use={"body1"}>{t`environment.`}</Typography> <br/>
            <Typography use={"body1"}>{t`All it's content and the environment itself will be removed. This operation cannot be undone.`}</Typography> <br/>
            <Typography use={"body1"}>{t`To confirm, type the name of the environment in the field below:`}</Typography> <br />
            <Input className={inputStyles} value={name} onChange={setName}/>
        </div>
    )
}
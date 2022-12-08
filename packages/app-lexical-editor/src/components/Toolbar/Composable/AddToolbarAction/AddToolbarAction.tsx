import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import React, { FC, useEffect } from 'react'
import { Component } from 'react';
import useToolbar from '~/hooks/useToolbar';
import action from '@webiny/app-page-builder/editor/plugins/elementSettings/action';

interface AddToolbarActionProps {
   ariaLabel: string;
   commandName: TextFormatType;
   connectComponent?: Component;
}

export const AddToolbarAction: FC<AddToolbarActionProps> = ({ commandName, ariaLabel }) => {

    const { editor, addToolbarAction, actions, updateToolbarAction } = useToolbar();

    useEffect(() => {
        addToolbarAction({ name: commandName, value: false });
    }, []);

    useEffect(() => {
        const value = !action[commandName];
        updateToolbarAction({ name: commandName, value })
    }, [actions[commandName]])

    return(
        <>
        {
         actions?.[commandName] ? 
            (
                <button
                onClick={() => {
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, commandName);
                }}
                className={"popup-item spaced " + (actions ? "active" : "")}
                aria-label={ariaLabel}
            >
                <i className="format bold" />
            </button>
            ) : null
        }
    </>)
}

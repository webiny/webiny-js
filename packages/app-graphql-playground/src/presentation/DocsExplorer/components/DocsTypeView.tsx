import React from "react";
import { observer } from "mobx-react-lite";
import { DocsTypeRef } from "./DocsTypeRef.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsTypeViewProps {
    presenter: DocsExplorerPresenter.Interface;
    typeView: DocsExplorerPresenter.TypeView;
}

const KindBadge = (props: { kind: string }) => {
    return (
        <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700 ml-2">
            {props.kind}
        </span>
    );
};

const FieldArgs = (props: {
    args: DocsExplorerPresenter.ArgVm[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.args.length === 0) {
        return null;
    }

    return (
        <div className="ml-4 mt-1 text-sm text-gray-600">
            {props.args.map(arg => (
                <div key={arg.name} className="flex gap-1 items-baseline">
                    <span className="text-purple-700">{arg.name}</span>
                    <span>:</span>
                    <DocsTypeRef typeRef={arg.type} presenter={props.presenter} />
                    {arg.defaultValue ? (
                        <span className="text-gray-400"> = {arg.defaultValue}</span>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const ObjectFields = (props: {
    fields: DocsExplorerPresenter.FieldVm[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.fields.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Fields</h4>
            {props.fields.map(field => (
                <div key={field.name} className="mb-3 border-b border-gray-100 pb-2">
                    <div className="flex gap-1 items-baseline">
                        <span className="font-mono font-bold text-sm">{field.name}</span>
                        <span>:</span>
                        <DocsTypeRef typeRef={field.type} presenter={props.presenter} />
                    </div>
                    {field.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{field.description}</p>
                    ) : null}
                    <FieldArgs args={field.args} presenter={props.presenter} />
                </div>
            ))}
        </div>
    );
};

const InputFields = (props: {
    fields: DocsExplorerPresenter.InputFieldVm[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.fields.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Input Fields</h4>
            {props.fields.map(field => (
                <div key={field.name} className="mb-3 border-b border-gray-100 pb-2">
                    <div className="flex gap-1 items-baseline">
                        <span className="font-mono font-bold text-sm">{field.name}</span>
                        <span>:</span>
                        <DocsTypeRef typeRef={field.type} presenter={props.presenter} />
                        {field.defaultValue ? (
                            <span className="text-gray-400"> = {field.defaultValue}</span>
                        ) : null}
                    </div>
                    {field.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{field.description}</p>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const EnumValues = (props: { values: DocsExplorerPresenter.EnumValueVm[] }) => {
    if (props.values.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Values</h4>
            {props.values.map(value => (
                <div key={value.name} className="mb-2">
                    <span className="font-mono text-sm font-bold">{value.name}</span>
                    {value.description ? (
                        <p className="text-sm text-gray-500 mt-0.5">{value.description}</p>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

const PossibleTypes = (props: {
    types: DocsExplorerPresenter.TypeRef[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.types.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Possible Types</h4>
            <div className="flex flex-wrap gap-2">
                {props.types.map(typeRef => (
                    <DocsTypeRef key={typeRef.name} typeRef={typeRef} presenter={props.presenter} />
                ))}
            </div>
        </div>
    );
};

const Interfaces = (props: {
    types: DocsExplorerPresenter.TypeRef[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.types.length === 0) {
        return null;
    }

    return (
        <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Implements</h4>
            <div className="flex flex-wrap gap-2">
                {props.types.map(typeRef => (
                    <DocsTypeRef key={typeRef.name} typeRef={typeRef} presenter={props.presenter} />
                ))}
            </div>
        </div>
    );
};

export const DocsTypeView = observer((props: DocsTypeViewProps) => {
    const { typeView, presenter } = props;

    return (
        <div className="p-4">
            <div className="flex items-baseline mb-2">
                <h3 className="text-lg font-bold">{typeView.name}</h3>
                <KindBadge kind={typeView.typeKind} />
            </div>
            {typeView.description ? (
                <p className="text-sm text-gray-600 mb-3">{typeView.description}</p>
            ) : null}
            <ObjectFields fields={typeView.fields} presenter={presenter} />
            <InputFields fields={typeView.inputFields} presenter={presenter} />
            <EnumValues values={typeView.enumValues} />
            <PossibleTypes types={typeView.possibleTypes} presenter={presenter} />
            <Interfaces types={typeView.interfaces} presenter={presenter} />
        </div>
    );
});

import React from "react";
import { observer } from "mobx-react-lite";
import { DocsTypeRef } from "./DocsTypeRef.js";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsRootViewProps {
    presenter: DocsExplorerPresenter.Interface;
    rootView: DocsExplorerPresenter.RootView;
}

const SearchInput = (props: { value: string; presenter: DocsExplorerPresenter.Interface }) => {
    return (
        <div className="p-3 border-b border-gray-200">
            <input
                type="text"
                placeholder="Search types, fields, args..."
                value={props.value}
                onChange={ev => props.presenter.setSearchQuery(ev.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
        </div>
    );
};

const RootSectionField = (props: {
    field: DocsExplorerPresenter.FieldVm;
    presenter: DocsExplorerPresenter.Interface;
}) => {
    const handleClick = () => {
        if (props.field.type.isNavigable) {
            props.presenter.navigateToType(props.field.type.name);
        }
    };

    return (
        <div
            className={`px-4 py-1.5 flex gap-1 items-baseline ${props.field.type.isNavigable ? "hover:bg-gray-50 cursor-pointer" : ""}`}
            onClick={handleClick}
        >
            <span className="font-mono text-sm">{props.field.name}</span>
            <span className="text-gray-400">:</span>
            <DocsTypeRef typeRef={props.field.type} presenter={props.presenter} />
        </div>
    );
};

const RootSections = (props: {
    sections: DocsExplorerPresenter.RootSection[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    return (
        <>
            {props.sections.map(section => (
                <div key={section.name} className="mb-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 px-4">
                        {section.name}
                    </h4>
                    {section.fields.map(field => (
                        <RootSectionField
                            key={field.name}
                            field={field}
                            presenter={props.presenter}
                        />
                    ))}
                </div>
            ))}
        </>
    );
};

const FilteredTypeList = (props: {
    types: DocsExplorerPresenter.TypeSummary[];
    presenter: DocsExplorerPresenter.Interface;
}) => {
    if (props.types.length === 0) {
        return <div className="p-4 text-sm text-gray-400 italic">No matching types.</div>;
    }

    return (
        <>
            {props.types.map(type => (
                <TypeSummaryRow key={type.name} type={type} presenter={props.presenter} />
            ))}
        </>
    );
};

const TypeSummaryRow = (props: {
    type: DocsExplorerPresenter.TypeSummary;
    presenter: DocsExplorerPresenter.Interface;
}) => {
    const handleClick = () => {
        if (props.type.isNavigable) {
            props.presenter.navigateToType(props.type.name);
        }
    };

    return (
        <div
            className={`px-4 py-1.5 flex items-baseline gap-2 ${props.type.isNavigable ? "hover:bg-gray-50 cursor-pointer" : ""}`}
            onClick={handleClick}
        >
            <span
                className={`font-mono text-sm ${props.type.isNavigable ? "text-blue-600" : "text-gray-700"}`}
            >
                {props.type.name}
            </span>
            <span className="text-xs text-gray-400">{props.type.typeKind}</span>
            {props.type.matchContext ? (
                <span className="text-xs text-gray-400 italic ml-auto">
                    {props.type.matchContext}
                </span>
            ) : null}
        </div>
    );
};

export const DocsRootView = observer((props: DocsRootViewProps) => {
    const { rootView, presenter } = props;
    const hasSearch = presenter.vm.searchQuery !== "";

    return (
        <div>
            <SearchInput value={presenter.vm.searchQuery} presenter={presenter} />
            <div className="overflow-y-auto pt-2" style={{ maxHeight: "calc(100vh - 140px)" }}>
                {hasSearch ? (
                    <FilteredTypeList types={rootView.filteredTypes} presenter={presenter} />
                ) : (
                    <>
                        <RootSections sections={rootView.sections} presenter={presenter} />
                        <div className="mt-4 mb-2 px-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                                All Types
                            </h4>
                        </div>
                        <FilteredTypeList types={rootView.filteredTypes} presenter={presenter} />
                    </>
                )}
            </div>
        </div>
    );
});

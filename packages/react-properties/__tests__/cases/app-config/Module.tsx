/**
 * Not meant to work, just to show how the config looks like.
 */
// @ts-nocheck keep it
/* eslint-disable */
import React from "react";
export const FilesRepositorySymbol = Symbol.for("FilesRepositorySymbol");
export interface IFilesRepository {
    listFiles(): Promise<any[]>;
}

const config = (
    <Config>
        {/* Register routes */}
        <Route name={"fm.list"} path={"/files"} element={<FilesList />} />
        {/* Register menu items */}
        <Menu name={"fm.list"} path={"/files"} label={"Files"} />
        {/* Register repositories (to interact with data sources, provide cache, etc.) */}
        <Repository id={FilesRepositorySymbol} repository={FilesRepository} />
        {/* Register GraphQL queries and mutations */}
        <Query name={"ListFiles"}>
            <Field name={"listFiles"} />
        </Query>
        {/* Decorate existing classes */}
        <Decorator id={FilesRepositorySymbol} decorator={FilesRepositoryDecorator} />
    </Config>
);

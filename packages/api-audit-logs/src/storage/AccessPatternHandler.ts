import { WebinyError } from "@webiny/error";
import type { IStorageListParams, IStorageListResult } from "~/storage/abstractions/Storage.js";
import type { IAccessPatternHandler } from "~/storage/abstractions/AccessPatternHandler.js";
import type { IAccessPattern } from "~/storage/abstractions/AccessPattern.js";

export interface IAccessPatternHandlerParams {
    patterns: IAccessPattern<unknown>[];
}

export class AccessPatternHandler implements IAccessPatternHandler {
    private readonly patterns;

    public constructor(params: IAccessPatternHandlerParams) {
        this.patterns = params.patterns;
    }

    public addPatterns(patterns: IAccessPattern<unknown>[]) {
        this.patterns.push(...patterns);
    }

    public async handle(params: IStorageListParams): Promise<IStorageListResult> {
        const pattern = this.find(params);
        if (!pattern) {
            throw new WebinyError({
                message: "No access pattern found for the given parameters.",
                code: "ACCESS_PATTERN_NOT_FOUND",
                data: {
                    ...params
                }
            });
        }

        try {
            return await pattern.list(params);
        } catch (ex) {
            return {
                error: ex,
                success: false
            };
        }
    }

    public getDefaultPattern(): IAccessPattern<unknown> {
        const pattern = this.patterns.find(pattern => {
            return pattern.index === undefined;
        });
        if (!pattern) {
            throw new WebinyError({
                message: "No default access pattern found.",
                code: "DEFAULT_ACCESS_PATTERN_NOT_FOUND"
            });
        }
        return pattern;
    }

    public listIndexPatterns(): IAccessPattern<unknown>[] {
        return this.patterns.filter(pattern => {
            return pattern.index !== undefined;
        });
    }

    private find(params: IStorageListParams): IAccessPattern<unknown> | undefined {
        /**
         * First we need to go through all the patterns and find the one that can handle the given params.
         */
        for (const pattern of this.patterns) {
            if (pattern.canHandle(params)) {
                return pattern;
            }
        }
        /**
         * If none can handle, let's find one which has index set to undefined (default pattern).
         */
        return this.patterns.find(pattern => {
            return pattern.index === undefined;
        });
    }
}

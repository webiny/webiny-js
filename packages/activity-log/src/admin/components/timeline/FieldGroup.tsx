import React from "react";
import { cn, Icon, Tag, Text, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as SubdirectoryIcon } from "@webiny/icons/subdirectory_arrow_right.svg";
import type { DisclosedFieldGroup } from "~/admin/timeline/summariseItem.js";
import { TYPE } from "../typeScale.js";
import { FieldChip } from "./FieldChip.js";

/**
 * The fields of one save that share a path, with the path said once above them.
 *
 * Field first, path second — the design's treatment B — and the path stated once rather than per
 * field. Four fields under the same variant used to state that variant four times, which was most
 * of what made this read as a form. Deep paths elide their middle and carry the depth beside them,
 * so shortening never hides how far down a change was; the whole path is on hover.
 */
export const FieldGroup = ({ group }: { group: DisclosedFieldGroup }) => (
    <div className={"min-w-0"}>
        {group.path.length > 0 ? (
            <Tooltip
                content={group.fullPath}
                trigger={
                    <div className={"mb-xxs flex items-center gap-xxs text-neutral-strong"}>
                        <Icon
                            size={"sm"}
                            label={"inside"}
                            icon={<SubdirectoryIcon />}
                            className={"shrink-0 fill-neutral-strong"}
                        />
                        <Text className={cn(TYPE.field, "truncate")}>{group.pathLabel}</Text>
                        {group.depth === "" ? null : (
                            <Tag variant={"neutral-light"} content={group.depth} />
                        )}
                    </div>
                }
            />
        ) : null}
        <div className={"flex flex-wrap gap-xxs"}>
            {group.fields.map((change, index) => (
                <FieldChip
                    key={`${change.text}-${change.operation ?? ""}-${index}`}
                    change={change}
                />
            ))}
        </div>
    </div>
);

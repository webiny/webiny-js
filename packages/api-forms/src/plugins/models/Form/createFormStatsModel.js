import { flow } from "lodash";
import { withFields, number, withProps } from "@webiny/commodo";

export default () =>
    flow(
        withFields({
            views: number({ value: 0 }),
            submissions: number({ value: 0 })
        }),
        withProps(instance => ({
            get conversionRate() {
                if (instance.views > 0) {
                    return ((instance.submissions / instance.views) * 100).toFixed(2);
                }
                return 0;
            },
            incrementViews() {
                instance.views++;
            },
            incrementSubmissions() {
                instance.submissions++;
            }
        }))
    )();

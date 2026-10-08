import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import { ChannelRevenueWidget } from "./ChannelRevenueWidget.js";
import { FulfilmentWidget } from "./FulfilmentWidget.js";
import { LatestProductsWidget } from "./LatestProductsWidget.js";
import { SalesWidget } from "./SalesWidget.js";
import { StoreKpisWidget } from "./StoreKpisWidget.js";

/**
 * Example: add widgets to the admin dashboard.
 *
 * `title`, `description` and `group` describe a widget in the "Add widget" drawer. These widgets
 * use static data, so each one can be its own `preview`. A widget that loads data should pass a
 * static stand-in instead.
 */
export default () => {
    return (
        <AdminConfig>
            <AdminConfig.Dashboard.Widget
                name={"demo.storeKpis"}
                title={"Store at a glance"}
                description={"Orders, conversion and customers this week."}
                group={"Store"}
                column={"left"}
                element={<StoreKpisWidget />}
                preview={<StoreKpisWidget />}
            />
            <AdminConfig.Dashboard.Widget
                name={"demo.sales"}
                title={"Sales"}
                description={"Daily revenue over the last 14 days."}
                group={"Store"}
                column={"left"}
                element={<SalesWidget />}
                preview={<SalesWidget />}
            />
            <AdminConfig.Dashboard.Widget
                name={"demo.channelRevenue"}
                title={"Revenue by channel"}
                description={"Where the last 14 days of sales came from."}
                group={"Store"}
                column={"right"}
                element={<ChannelRevenueWidget />}
                preview={<ChannelRevenueWidget />}
            />
            <AdminConfig.Dashboard.Widget
                name={"demo.latestProducts"}
                title={"Latest products"}
                description={"The newest additions to the catalog."}
                group={"Store"}
                column={"right"}
                element={<LatestProductsWidget />}
                preview={<LatestProductsWidget />}
            />
            <AdminConfig.Dashboard.Widget
                name={"demo.fulfilment"}
                title={"Fulfilment"}
                description={"This week's orders, by stage."}
                group={"Store"}
                column={"right"}
                element={<FulfilmentWidget />}
                preview={<FulfilmentWidget />}
            />
        </AdminConfig>
    );
};

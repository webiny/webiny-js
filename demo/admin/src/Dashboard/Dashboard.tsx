import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { AcoConfig, AcoWithConfig } from "@webiny/app-aco";
import { ListArticlesGateway } from "./ListArticlesGateway";
import { ArticlesRepository } from "./ArticlesRepository";
import { DashboardPresenter } from "./DashboardPresenter";
import { DashboardView } from "./DashboardView";
import { PreviewButton } from "./Components/PreviewButton";
import { DescriptionCell } from "./Components/Cells/DescriptionCell";
import { RegionCell } from "./Components/Cells/RegionCell";

const { Table } = AcoConfig;

export const Dashboard = React.memo(() => {
    const client = useApolloClient();
    const gateway = new ListArticlesGateway(client);
    const articlesRepository = new ArticlesRepository(gateway);
    const presenter = new DashboardPresenter(articlesRepository);

    return (
        <>
            <AcoConfig>
                <Table.Column name={"title"} header={"Title"} />
                <Table.Column
                    name={"description"}
                    header={"Description"}
                    cell={<DescriptionCell />}
                />
                <Table.Column
                    name={"region"}
                    header={"Region / Language"}
                    cell={<RegionCell />}
                    size={100}
                />
                <Table.Column
                    name={"actions"}
                    header={"Actions"}
                    cell={<PreviewButton />}
                    size={100}
                />
            </AcoConfig>
            <AcoWithConfig>
                <DashboardView presenter={presenter} />
            </AcoWithConfig>
        </>
    );
});

Dashboard.displayName = `Dashboard<CompositionRoot>`;

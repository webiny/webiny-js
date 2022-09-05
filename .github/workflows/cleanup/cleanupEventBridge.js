const EventBridge = require("aws-sdk/clients/eventbridge");

const eventbridge = new EventBridge({ region: process.env.AWS_REGION || "eu-central-1" });

async function deleteEventBusRules(eventBus) {
    const { Rules } = await eventbridge.listRules({ EventBusName: eventBus.Name }).promise();
    for (const rule of Rules) {
        const { Targets } = await eventbridge
            .listTargetsByRule({ EventBusName: eventBus.Name, Rule: rule.Name })
            .promise();

        if (Targets.length > 0) {
            await eventbridge
                .removeTargets({
                    Ids: Targets.map(t => t.Id),
                    Rule: rule.Name,
                    EventBusName: eventBus.Name
                })
                .promise();
        }

        await eventbridge.deleteRule({ Name: rule.Name, EventBusName: eventBus.Name }).promise();
    }
}

async function deleteEventBus(eventBus) {
    console.log(`[${eventBus.Name}] Trying to delete...`);

    await deleteEventBusRules(eventBus);

    return eventbridge
        .deleteEventBus({ Name: eventBus.Name })
        .promise()
        .then(() => {
            console.log(`[${eventBus.Name}] Deleted!`);
            return true;
        })
        .catch(err => {
            console.log(`[${eventBus.Name}] Error: ${err.message}`);
            return false;
        });
}

(async () => {
    let nextToken;
    let count = 0;
    while (true) {
        const { EventBuses, NextToken } = await eventbridge
            .listEventBuses({ NextToken: nextToken })
            .promise();

        nextToken = NextToken;

        const results = await Promise.all(
            EventBuses.filter(bus => bus.Name !== "default").map(deleteEventBus)
        );

        count += results.filter(Boolean).length;

        if (!nextToken) {
            break;
        }
    }

    console.log(`Deleted ${count} EventBus resources.`);
})();

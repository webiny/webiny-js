import path from "path";
import fs from "fs";

export type GatewayConfig = Record<
    string,
    {
        domain: string;
        weight: number;
    }
>;

export interface GatewayConfigParams {
    cwd: string;
    app: string;
    env: string;
}

export interface GatewayConfigUpdateParams extends GatewayConfigParams {
    variant: string;
    domain: string;
}

export async function updateGatewayConfig(params: GatewayConfigUpdateParams) {
    const configPath = getGatewayConfigFilePath(params);
    const config = await readGatewayConfigFile(configPath);

    if (config[params.variant]) {
        // Update existing config.
        config[params.variant].domain = params.domain;
    } else {
        config[params.variant] = {
            domain: params.domain,
            // Every newly deployed variant has 0% of traffic.
            weight: 0
        };
    }

    await writeGatewayConfigFile(configPath, config);
}

export async function loadGatewayConfig(params: GatewayConfigParams) {
    const configPath = getGatewayConfigFilePath(params);
    return readGatewayConfigFile(configPath);
}

function getGatewayConfigFilePath(params: GatewayConfigParams) {
    return path.join(params.cwd, `gateway.${params.app}.${params.env}.json`);
}

async function readGatewayConfigFile(filePath: string): Promise<GatewayConfig> {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const configJson = await fs.promises.readFile(filePath, { encoding: "utf-8" });
    return JSON.parse(configJson) || {};
}

async function writeGatewayConfigFile(filePath: string, config: GatewayConfig) {
    const configJson = JSON.stringify(config, null, 4);
    await fs.promises.writeFile(filePath, configJson, { encoding: "utf-8" });
}

import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import {
  AiPowerUpsSettingsFeature,
  AiPowerUpsSettingsConfig,
  useAiPowerUpsSettingsDialog,
} from "./presentation/AiPowerUpsSettings/index.js";
import { WbContentGeneration } from "~/admin/presentation/WbContentGeneration/Extension.js";
import { AiPowerUpsHeadlessFeatures } from "~/admin/features/feature.js";

const { Menu } = AdminConfig;

const AiPowerUpsMenuItem = () => {
  const openSettings = useAiPowerUpsSettingsDialog();

  return <Menu.Item text="AI Power-Ups" onClick={openSettings} />;
};

const AiPowerUpsMenu = () => {
  return (
    <AdminConfig>
      <Menu
        parent={"settings.system"}
        name="aiPowerUps"
        element={<AiPowerUpsMenuItem />}
      />
    </AdminConfig>
  );
};

export const Extension = () => {
  return (
    <>
      <RegisterFeature feature={AiPowerUpsHeadlessFeatures} />
      <RegisterFeature feature={AiPowerUpsSettingsFeature} />
      <AiPowerUpsSettingsConfig />
      <AiPowerUpsMenu />
      {/* Website Builder Extension */}
      <WbContentGeneration />
    </>
  );
};

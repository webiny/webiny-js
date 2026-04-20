import {
  UpdateSettingsUseCase as UseCaseAbstraction,
  UpdateSettingsRepository,
} from "./abstractions.js";
import type { ISettings } from "~/admin/features/settings/shared/abstractions.js";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(private repository: UpdateSettingsRepository.Interface) {}

  async execute(data: ISettings): Promise<ISettings> {
    return this.repository.execute(data);
  }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
  implementation: UpdateSettingsUseCaseImpl,
  dependencies: [UpdateSettingsRepository],
});

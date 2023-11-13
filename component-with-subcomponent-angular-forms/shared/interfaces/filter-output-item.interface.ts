import { FilterTypesEnum } from '../enums/filter-types.enum';

export interface FilterOutputItemInterface {
  value: boolean | string | string[];
  type: FilterTypesEnum;
}

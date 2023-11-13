import { FilterValueTypesEnum } from '../enums/filter-value-types.enum';

export interface FilterGroupValue {
  name: string;
  icon: string;
  type: FilterValueTypesEnum;
  id: string;
  selectedName: string;
  value?: string;
  min?: string;
  max?: string;
  step?: string;
  currentMin?: string;
  currentMax?: string;
}

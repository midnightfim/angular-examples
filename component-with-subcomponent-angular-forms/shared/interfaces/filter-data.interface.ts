import { FilterGroupValue } from './filter-group-value.interface';
import { FilterGroupTypesEnum } from '../enums/filter-group-types.enum';

export interface FilterData {
  type?: FilterGroupTypesEnum;
  title?: string;
  name?: string;
  id?: string;
  isMulti?: boolean;
  icon?: string;
  values?: FilterGroupValue[];
  value?: string;
  selectedIds?: string[];
}

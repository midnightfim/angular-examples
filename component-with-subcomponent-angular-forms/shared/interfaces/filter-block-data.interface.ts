import { FilterData } from './filter-data.interface';

export interface FilterBlockData {
  title: string;
  svgIconName: string;
  groups: FilterData[];
}

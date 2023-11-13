
@Component({
  selector: 'filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnInit, OnDestroy {
  @Input() filters: FilterBlockData[];
  @Input() clearFilter: Subject<FilterOutputTagsInterface> = new Subject<FilterOutputTagsInterface>();

  @Output() updateFilters = new EventEmitter<{ [key: string]: FilterOutputItemInterface }>();
  @Output() updateFilterTags = new EventEmitter<FilterOutputTagsInterface[]>();
  @Output() setInitialFiltersState = new EventEmitter<{ [key: string]: FilterOutputItemInterface }>();

  @Output() filterTapEvent = new EventEmitter<boolean>();
  @Output() filterClearAllEvent = new EventEmitter<null>();
  @Output() filterApplyEvent = new EventEmitter<null>();

  isResetButtonDisabled = true;
  multipleSelectForm: FormGroup;

  UiWebFilterGroupTypesEnum = FilterGroupTypesEnum;

  private initialFiltersState: { [key: string]: string[] };
  private filterAdditionalInfo: { [key: string]: { type: FilterTypesEnum; titles: { [key: string]: string } } } = {};
  private orderShowChangedFilters: { [key: string]: number } = {};

  private destroy$ = new Subject();

  constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeFilterForm();

    this.setClearFiltersSub();
    this.setFormValueSub();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetFilters(filterGroup?: FilterData): void {
    if (!filterGroup) {
      this.multipleSelectForm.setValue(this.initialFiltersState);
      this.filterClearAllEvent.emit();
    } else {
      const resetValues = {};
      filterGroup.values.forEach((value) => {
        resetValues[value.id] = `${value.currentMin}-${value.currentMax}`;
      });
      this.multipleSelectForm.setValue({ ...this.multipleSelectForm.value, ...resetValues });
    }
  }

  setNewCheckboxValue(controlName: string): void {
    this.multipleSelectForm.get(controlName).setValue(!this.multipleSelectForm.get(controlName).value);
  }

  private initializeFilterForm(): void {
    const filterControlsObject = {};
    this.filters.forEach((block) => {
      block.groups.forEach((group) => {
        if (group.type === FilterGroupTypesEnum.SUBVIEW) {
          group.values.forEach((value) => {
            filterControlsObject[value.id] = new FormControl(`${value.currentMin}-${value.currentMax}`);
            this.filterAdditionalInfo[value.id] = {
              type: FilterTypesEnum.RANGE,
              titles: { [value.id]: `Рейтинг ${value.name}` },
            };
          });
        } else if (group.type === FilterGroupTypesEnum.CHECKBOX) {
          filterControlsObject[group.id] = new FormControl(!!group.value);
          this.filterAdditionalInfo[group.id] = {
            type: FilterTypesEnum.CHECKBOX,
            titles: { [group.id]: group.name },
          };
        } else {
          filterControlsObject[group.id] = new FormControl(group.selectedIds);
          this.filterAdditionalInfo[group.id] = {
            type: block.groups.length === 1 ? FilterTypesEnum.SORTING : FilterTypesEnum.DROPDOWN,
            titles: {},
          };
          group.values.forEach((value) => {
            this.filterAdditionalInfo[group.id].titles[value.id] = value.name;
          });
        }
      });
    });

    this.multipleSelectForm = this.fb.group(filterControlsObject);

    this.initialFiltersState = { ...this.multipleSelectForm.value };
    const filters: { [key: string]: FilterOutputItemInterface } = {};
    for (const key in this.initialFiltersState) {
      filters[key] = { value: this.initialFiltersState[key], type: this.filterAdditionalInfo[key].type };
    }
    this.setInitialFiltersState.emit(filters);
    this.updateFilters.emit(filters);
  }

  private setFormValueSub(): void {
    this.multipleSelectForm.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        throttleTime(100, asyncScheduler, { leading: false, trailing: true }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isResetButtonDisabled = isEqual({ ...this.multipleSelectForm.value }, this.initialFiltersState);
        const filters: { [key: string]: FilterOutputItemInterface } = {};
        for (const key in this.multipleSelectForm.value) {
          filters[key] = { value: this.multipleSelectForm.value[key], type: this.filterAdditionalInfo[key].type };
          if (!isEqual(this.multipleSelectForm.value[key], this.initialFiltersState[key])) {
            if (!this.orderShowChangedFilters[key]) {
              this.orderShowChangedFilters[key] = 1;
            }
          } else if (this.orderShowChangedFilters[key]) {
            delete this.orderShowChangedFilters[key];
          }
        }

        const filterTags: FilterOutputTagsInterface[] = [];
        for (const key in this.orderShowChangedFilters) {
          if (
            this.filterAdditionalInfo[key].type === FilterTypesEnum.DROPDOWN ||
            this.filterAdditionalInfo[key].type === FilterTypesEnum.SORTING
          ) {
            (filters[key].value as string[]).forEach((value) => {
              filterTags.push({ title: this.filterAdditionalInfo[key].titles[value], filterId: key, valueId: value });
            });
          } else {
            filterTags.push({ title: this.filterAdditionalInfo[key].titles[key], filterId: key, valueId: null });
          }
        }

        this.updateFilterTags.emit(filterTags);
        this.updateFilters.emit(filters);
        this.filterApplyEvent.emit();
      });
  }

  private setClearFiltersSub(): void {
    this.clearFilter.pipe(takeUntil(this.destroy$)).subscribe((tag) => {
      if (!tag) {
        this.multipleSelectForm.setValue({
          ...this.initialFiltersState,
        });
      } else {
        if (tag.valueId) {
          let newValue = this.multipleSelectForm.get(tag.filterId).value.filter((value) => value !== tag.valueId);
          if (newValue.length === 0) {
            newValue = this.initialFiltersState[tag.filterId];
          }
          this.multipleSelectForm.setValue({
            ...this.multipleSelectForm.value,
            [tag.filterId]: newValue,
          });
        } else {
          this.multipleSelectForm.setValue({
            ...this.multipleSelectForm.value,
            [tag.filterId]: this.initialFiltersState[tag.filterId],
          });
        }
      }
    });
  }
}

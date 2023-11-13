
@Component({
  selector: 'filter-dropdown',
  templateUrl: './filter-dropdown.component.html',
  styleUrls: ['./filter-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterDropdownComponent),
      multi: true,
    },
  ],
})
export class FilterDropdownComponent implements OnInit, OnDestroy {
  @Input() filter: FilterData;
  @Input() title: string;
  @Input() id: string;
  @Input() icon: string;
  @Input() multipleFiltersBlock = false;
  @Input() isFirstLevelDropdown = false;

  @Output() filterTapEvent = new EventEmitter<boolean>();

  options: UiWebDropdownListOptionInterface[];
  selectedItems: UiWebDropdownListOptionInterface[] = [];

  noItemsTitle = '';
  dropdownTheme = DropdownContentTheme;

  onTouchCallback = () => noop;
  onChange = (items: string[]) => noop;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.filter) {
      if (!this.isFirstLevelDropdown) {
        this.noItemsTitle = this.filter.values.find(item => item.type === FilterValueTypesEnum.DROPDOWN_ALL).selectedName;
        this.title = this.noItemsTitle;
      } else {
        this.title = this.filter.title;
      }
      this.options = this.filter.values.map((value) => {
        return {
          id: value.id,
          title: value.name,
          selectedName: value.selectedName || value.name,
          resetAllOption: value.type === FilterValueTypesEnum.DROPDOWN_ALL,
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectItems(items: UiWebDropdownListOptionInterface[]): void {
    this.selectedItems = items;
    if (!this.isFirstLevelDropdown) {
      this.title = this.selectedItems.map(item => item.selectedName).join(', ') || this.noItemsTitle;
    }
  }

  emitFiltersOnClose(isOpen: boolean) {
    if (!isOpen) {
      this.emitFilters();
    }
  }

  handleDropdownButtonClick(component: UiWebDropdownComponent, event: MouseEvent) {
    if (this.isFirstLevelDropdown && !component.isOpen) {
      this.sendFilterTapEvent();
    }
    if (this.multipleFiltersBlock && component.isOpen) {
      component.isOpen = false;
      component.hide();
      event.stopPropagation();
    }
  }

  registerOnChange(fn: never) {
    this.onChange = fn;
  }

  registerOnTouched(fn: never) {
    this.onTouchCallback = fn;
  }

  writeValue(values: string[]) {
    this.selectItems(this.options?.filter((option) => values.find(value => value === String(option?.id))));
    this.cdr.detectChanges();
  }

  private emitFilters(): void {
    if (this.filter) {
      this.onChange(this.selectedItems?.map((item) => String(item?.id)));
      this.cdr.detectChanges();
    }
  }

  private sendFilterTapEvent() {
    if (this.isFirstLevelDropdown) {
      this.filterTapEvent.emit(this.multipleFiltersBlock);
    }
  }
}

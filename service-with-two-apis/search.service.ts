
@Injectable()
export class SearchService{
  static readonly emptyResult: SearchShelfResponseInterface<any> = {
    isAll: true,
    found: [],
    offset: 0,
  };

  programIdToOpenInfoModal: number;
  shelfRanging = SearchService.searchDefaultRanging;
  openKeyboardOnStart = true;

  constructor(
    private firstSearchApiService: FirstSearchApiService,
    private secondSearchApiService: SecondSearchApiService,
  ) {
  }

  getSuggestKeywords(key: string, count: number): Observable<string[]> {
    if (key) {
      key = SearchService.replaceYoChar(key);
      return this.firstSearchApiService
        .suggestKeyword({
          count: count.toString(),
          key,
        })
        .pipe(map((result) => result.suggests));
    } else {
      return of([]);
    }
  }

  search(searchKey: string, shelfRequestsArray: SearchShelfRequestInterface[], excluder?: SearchExcluder): Observable<SearchData> {
    return combineLatest(
      shelfRequestsArray.map((item) =>
        item.isFirstApi
          ? this.firstSearch(searchKey, item.shelfTypes, item.count, item.offset)
          : this.secondSearch(searchKey, item.shelfTypes[0], item.count, item.offset, excluder)
      )
    ).pipe(
      map((data) => {
        const getItemByType = (type) => {
          if (firstResponse) {
            return firstResponse.find((item) => item.type === type) || SearchService.emptyResult;
          }
          return shelfRequestsArray.find((item) => item.shelfTypes[0] === type)
            ? data[shelfRequestsArray.findIndex((item) => item.shelfTypes[0] === type)][0]
            : SearchService.emptyResult;
        };

        const firstResponse = data.find((item) => item[0]?.isFirst);
        if (firstResponse?.[0]?.errorCode) {
          return {
            errorCode: String(firstResponse[0].errorCode),
          };
        }

        if (shelfRequestsArray.length > 1) {
          this.shelfRanging = firstResponse
            ? firstResponse.filter((shelfResponse) => shelfResponse.found?.length).map((shelfResponse) => shelfResponse.type)
            : SearchService.searchDefaultRanging.filter((shelfType) => getItemByType(shelfType)?.found?.length);
        }

        return {
          DATA1: getItemByType(SearchShelfTypeEnum.DATA1),
          DATA2: getItemByType(SearchShelfTypeEnum.DATA2),
          DATA3: getItemByType(SearchShelfTypeEnum.DATA3),
          DATA4: getItemByType(SearchShelfTypeEnum.DATA4),
        };
      })
    );
  }

  private secondSearch(
    searchKey: string,
    shelfType: SearchShelfTypeEnum,
    count: number,
    offset: number,
    excluder?: SearchExcluder
  ): Observable<SearchShelfResponseInterface[]> {
    if (searchKey) {
      searchKey = SearchService.replaceYoChar(searchKey);
      return this.getSearchRequestDataByType(shelfType, excluder).pipe(
        mergeMap((data: Partial<SearchContentRequest>) => {
          return this.firstSearchApiService
            .searchContent({
              searchKey,
              searchScopes: SearchService.searchScope,
              offset: offset.toString(),
              count: count.toString(),
              ...data,
            })
            .pipe(
              filter((result) => is(result.contents)),
              map((result) => [this.convertResponceResponseByType(shelfType, result, count, offset)])
            );
        })
      );
    } else {
      return of([SearchService.emptyResult]);
    }
  }

  private firstSearch(
    searchKey: string,
    shelfTypes: SearchShelfTypeEnum[],
    count: number,
    offset: number
  ): Observable<SearchShelfResponseInterface[]> {
    if (searchKey) {
      return this.secondSearchApiService
        .search(
          {
            term: searchKey,
            type: shelfTypes.map((item) => this.firstToServiceShelfEnumMapper(item)),
          },
          offset,
          count
        )
        .pipe(
          map((result) => {
            return result.items.map((item) => this.convertPosterResponseByType(item, count, offset));
          }),
          catchError((err) => {
            return of([{ errorCode: (err.errorCode ? err.errorCode : err.error?.errorCode) || SearchService.defaultErrorCode, isFirst: true }]);
          })
        );
    } else {
      return of([SearchService.emptyResult]);
    }
  }

  private convertFirstByType(shelf: ShelfInterface, count: number, offset: number): SearchShelfResponseInterface {
    switch (shelf.type) {
      case ShelfTypeEnum.DATA1:
        return {
          isAll: +shelf.total <= offset + count,
          found: shelf.items.map((channel) => channel.link.channelId),
          type: this.firstRespMapper(shelf.type),
          offset,
        };
      case ShelfTypeEnum.DATA2:
        return {
          isAll: +shelf.total <= offset + count,
          found: shelf.items.map((item) => DATA2Model.getModel(item)),
          type: this.firstRespMapper(shelf.type),
          offset,
        };
      case ShelfTypeEnum.DATA3:
      case ShelfTypeEnum.DATA4:
        return {
          type: this.firstRespMapper(shelf.type),
        };
      default: {
        return SearchService.emptyResult;
      }
    }
  }

  private convertSecondResponseByType(
    shelfType: SearchShelfTypeEnum,
    result: SearchContentResponse,
    count: number,
    offset: number
  ): SearchShelfResponseInterface {
    switch (shelfType) {
      case SearchShelfTypeEnum.DATA1:
        return {
          isAll: +result.total <= offset + count,
          found: result.contents.map((item) => +item.ID),
          type: shelfType,
          offset,
        };
      case SearchShelfTypeEnum.DATA2:
        return {
          isAll: +result.total <= offset + count,
          found: result.contents.map((item) => DATA2Model.getModelFromSecond(item)),
          type: shelfType,
          offset,
        };
      case SearchShelfTypeEnum.DATA3:
      case SearchShelfTypeEnum.DATA4:
        return {
          isAll: +result.total <= offset + count,
          found: result.contents.map((item) => new DATA4Model(item.playbill, null, shelfType === SearchShelfTypeEnum.DATA4)),
          type: shelfType,
          offset,
        };
      default: {
        return SearchService.emptyResult;
      }
    }
  }

  private static replaceYoChar(text: string): string {
    return text
      .split('')
      .map((c) => {
        const cc = c.charCodeAt(0);
        if (cc === 235) {
          return 'ё';
        } else if (cc === 203) {
          return 'Ё';
        } else {
          return c;
        }
      })
      .join('');
  }
}

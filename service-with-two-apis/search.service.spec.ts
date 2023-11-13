describe('SearchService', () => {
    let searchService: SearchService;
    let secondSearchApiService: SecondSearchApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SearchModule, HttpClientModule],
            providers: [SearchService, SecondSearchApiService, LocalStorage],
        });

        searchService = TestBed.inject(SearchService);
        secondSearchApiService = TestBed.inject(SecondSearchApiService);
    });

    it('should be created', () => {
        expect(searchService).toBeTruthy();
    });

    it('should be call getSearchRequestDataByType', () => {
        const mockResponse = {
            // some response
        };

        expect(searchService['getSearchRequestDataByType'](SearchShelfTypeEnum.DATA1)).toEqual(mockResponse);
    });

    it('should be call getSuggestKeywords', (done) => {
        const mockResponse = {suggests: ['1', '18', '1 1', '16', '100', '1', '12', '10', '13', '1']};

        secondSearchApiService.suggestKeyword = jest.fn(() => of(mockResponse)) as any;

        searchService['getSuggestKeywords']('1', 10).subscribe((keywords) => {
            expect(keywords.reduce((sum, keyword) => keyword.length && keyword.length <= 10 && sum, true)).toBeTruthy();
            done();
        });
    });

    it('should be call replaceYoChar', () => {
        // 1 - латинский 2 - кирилица
        const yoString = 'ËËËËËËËËËËëëëëëëëëëëëë ЁЁЁЁЁЁЁЁЁЁёёёёёёёёёёёё';

        expect(
            SearchService['replaceYoChar'](yoString)
                .split('')
                .reduce((sum, char) => char.charCodeAt(0) !== 235 && char.charCodeAt(0) !== 203 && sum, true)
        ).toBeTruthy();
    });
});

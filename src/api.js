//const API_KEY = '';
// todo 48 min

export const loadTickers = (tickers) => {
    const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
    LINK.searchParams.set('tsyms', 'USD');
    LINK.searchParams.set('fsyms', tickers.join(','));

    return fetch(LINK.toString())
        .then(r => r.json())
        .then(rawData =>
            Object.fromEntries(
                Object.entries(rawData).map(
                    ([key, value]) => [key, value.USD]
                )
            )
        );
}
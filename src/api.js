const API_KEY = '';

export const loadTickers = (tickers) => {
    return fetch(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tickers.join(',')}`)
        .then(r => r.json);
}
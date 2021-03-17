//const API_KEY = '';
// todo 1:18:00

const ticker_handlers = new Map();

const loadTickers = () => {
    if (ticker_handlers.size === 0) {
        return;
    }

    const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
    LINK.searchParams.set('tsyms', 'USD');
    LINK.searchParams.set('fsyms', [...ticker_handlers.keys()].join(','));

    fetch(LINK.toString())
        .then(r => r.json())
        .then(rawData => {
            /*
            const updated_prices = Object.fromEntries(
                Object.entries(rawData).map(
                    ([key, value]) => [key, value.USD]
                )
            );

            for (let [currency, new_price] of Object.entries(updated_prices)) {
                const handlers = ticker_handlers.get(currency) ?? [];
                for (let fn of handlers) {
                    fn(new_price);
                }
            }
            */

            for (let currency in rawData) {
                if (!rawData.hasOwnProperty(currency)) continue;

                const new_price = rawData[currency]['USD'];

                if (ticker_handlers.has(currency)) {
                    ticker_handlers.get(currency)(new_price);
                }
            }
        });
};

export const subscribeToTicker = (ticker, cb) => {
    /*
    const subscribers = ticker_handlers.get(ticker) || [];
    ticker_handlers.set(ticker, [...subscribers, cb]);
    */

    ticker_handlers.set(ticker, cb);
}

export const unsubscribeFromTicker = (ticker) => {
    ticker_handlers.delete(ticker);
}

setInterval(loadTickers, 5000);

export const loadCoins = async () => {
    const f = await fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`);
    const r = await f.json();

    if (!('Data' in r)) return;

    let result = [];
    for (let coin in r.Data) {
        if (!r.Data.hasOwnProperty(coin)) continue;

        result.push({name: r.Data[coin]['FullName'], symbol: r.Data[coin]['Symbol']});
    }

    return result;
};
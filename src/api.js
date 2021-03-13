//const API_KEY = '';
// todo 1:06:00

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
            const updated_prices = Object.fromEntries(
                Object.entries(rawData).map(
                    ([key, value]) => [key, value.USD]
                )
            );

            for (let {currency, new_price} of Object.entries(updated_prices)) {
                const handlers = ticker_handlers.get(currency) ?? [];
                for (let fn of handlers) {
                    fn(new_price);
                }
            }
        });
};

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = ticker_handlers.get(ticker) || [];
    ticker_handlers.set(ticker, [...subscribers, cb]);
}

export const unsubscribeFromTicker = (ticker, cb) => {
    const subscribers = ticker_handlers.get(ticker) || [];
    ticker_handlers.set(ticker, subscribers.filter(fn => fn !== cb));
}

setInterval(loadTickers, 5000);

export const loadCoins = async () => {
    const f = await fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`);
    const r = await f.json();

    return r.Data;
};
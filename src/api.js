//const API_KEY = '';
// todo 1:18:00

const ticker_handlers = new Map();

const loadTickers = async () => {
    channel.postMessage('Привет другому окну');

    if (ticker_handlers.size === 0) {
        return;
    }

    const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
    LINK.searchParams.set('tsyms', 'USD');
    LINK.searchParams.set('fsyms', [...ticker_handlers.keys()].join(','));

    const f = await fetch(LINK.toString());
    const r = await f.json();

    for (let currency in r) {
        const new_price = r[currency]['USD'];

        if (!ticker_handlers.has(currency)) continue;

        ticker_handlers.get(currency)(new_price);
    }
    /*
        fetch(LINK.toString())
            .then(r => r.json())
            .then(rawData => {
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
            });
    */
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

let channel = new BroadcastChannel('channel1');
channel.onmessage = function (e) {
    console.log(e);
}

export const loadCoins = async () => {
    const LINK = new URL('https://min-api.cryptocompare.com/data/all/coinlist');
    LINK.searchParams.set('summary', 'true');

    const f = await fetch(LINK.toString());
    const r = await f.json();

    if (!('Data' in r)) return;

    let result = [];
    for (let coin in r.Data) {
        result.push({name: r.Data[coin]['FullName'], symbol: r.Data[coin]['Symbol']});
    }

    return result;
};
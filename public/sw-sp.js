let connected = false;
let tickers = [];
self.addEventListener('connect', (e) => {
    e.source.addEventListener('message', (ev) => {
        if (ev.data === 'start') {
            if (connected === false) {
                connected = true;

                const loadTickers = async () => {
                    if (!tickers.length) {
                        return;
                    }

                    const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
                    LINK.searchParams.set('tsyms', 'USD');
                    LINK.searchParams.set('fsyms', [...tickers].join(','));

                    const f = await fetch(LINK.toString());
                    const r = await f.json();

                    for (let currency in r) {
                        const new_price = r[currency]['USD'];

                        if (tickers.indexOf(currency) === -1) continue;

                        self.dispatchEvent(new CustomEvent('interval', {
                            detail: {c: currency, n: new_price},
                        }));
                    }
                };
                setInterval(loadTickers, 5000);
            }
        } else {
            const {mode, ticker} = ev.data;

            if (mode === 'subscribeToTicker') {
                if (tickers.indexOf(ticker) > -1) return;
                tickers.push(ticker);
            }

            if (mode === 'unsubscribeFromTicker') {
                if (tickers.indexOf(ticker) === -1) return;
                tickers.splice(tickers.indexOf(ticker), 1);
            }
        }
    }, false);
    e.source.start();

    self.addEventListener('interval', function (ev) {
        e.source.postMessage(ev.detail);
    });
}, false);
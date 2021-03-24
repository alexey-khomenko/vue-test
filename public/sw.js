let connected = false;
self.addEventListener('connect', (e) => {
    console.log('connect');
    e.source.addEventListener('message', (ev) => {
        //const tickers = ev.data;
        //console.log('message', tickers);
        console.log(ev.data);
        if (connected === false) {
            connected = true;
            e.source.postMessage('worker init');
            //console.log('connected', tickers);
/*
            const loadTickers = async () => {
                if (!tickers.length) {
                    return;
                }

                console.log('setInterval', tickers);

                const LINK = new URL('https://min-api.cryptocompare.com/data/pricemulti');
                LINK.searchParams.set('tsyms', 'USD');
                LINK.searchParams.set('fsyms', [...tickers].join(','));

                const f = await fetch(LINK.toString());
                const r = await f.json();

                for (let currency in r) {
                    const new_price = r[currency]['USD'];

                    if (tickers.indexOf(currency) === -1) continue;

                    e.source.postMessage({c: currency, n: new_price});
                }
            };
            setInterval(loadTickers, 5000);

 */
        } else {
            console.log('....');
        }

    }, false);
    e.source.start();
}, false);
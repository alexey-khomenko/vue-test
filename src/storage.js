export const loadCurrenciesFromStorage = () => {
    const currencies = localStorage.getItem('cryptonomicon-list');
    return currencies ? JSON.parse(currencies) : [];
};

export const addCurrencyToStorage = (c) => {
    const currencies = loadCurrenciesFromStorage();
    if (currencies.indexOf(c) > -1) return;

    currencies.push(c);
    localStorage.setItem('cryptonomicon-list', JSON.stringify(currencies));
    currencies_channel.postMessage({mode: 'add', name: c});
};

export const removeCurrencyFromStorage = (c) => {
    const currencies = loadCurrenciesFromStorage();
    if (currencies.indexOf(c) === -1) return;

    currencies.splice(currencies.indexOf(c), 1);
    localStorage.setItem('cryptonomicon-list', JSON.stringify(currencies));
    currencies_channel.postMessage({mode: 'remove', name: c});
};
//----------------------------------------------------------------------------------------------------------------------
export const setCurrencyCallbacks = (add, remove) => {
    currency_handlers.set('add', add);
    currency_handlers.set('remove', remove);
}
const currency_handlers = new Map();
const currencies_channel = new BroadcastChannel('currencies_channel');
currencies_channel.addEventListener('message', function (e) {
    currency_handlers.get(e.data.mode)(e.data.name);
});
//----------------------------------------------------------------------------------------------------------------------
export const loadFilterFromStorage = () => {
    const window_data = Object.fromEntries(
        new URL(window.location).searchParams.entries()
    );

    return window_data.filter ?? '';
};

export const saveFilterToStorage = (f) => {
    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${f}&page=${loadPageFromStorage()}`
    );
};

export const loadPageFromStorage = () => {
    const window_data = Object.fromEntries(
        new URL(window.location).searchParams.entries()
    );

    return window_data.page ?? 1;
};

export const savePageToStorage = (p) => {
    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${loadFilterFromStorage()}&page=${p}`
    );
};
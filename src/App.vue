<template>
    <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
        <div class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
             v-show="loading"
        >
            <svg class="animate-spin -ml-1 mr-3 h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
        </div>
        <div class="container" v-show="!loading">

            <add-ticker @add-ticker="add" @loading-complete="loading = false" @clean-error="error = false"
                        :disabled="tooManyTickersAdded" :error="error"/>

            <template v-if="tickers.length">
                <hr class="w-full border-t border-gray-600 my-4"/>

                <div class="py-4">
                    <button v-show="page > 1"
                            @click="--page"
                            class="mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Назад
                    </button>
                    <button v-show="has_next_page"
                            @click="++page"
                            class="mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Вперёд
                    </button>
                    <input type="text" aria-label="filter"
                           class="border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md mx-2"
                           v-model="filter"/>
                </div>

                <hr class="w-full border-t border-gray-600 my-4"/>
                <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div v-for="t in paginated_tickers" :key="t.name"
                         class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
                         :class="{'border-4': selected_ticker === t}"
                    >
                        <div class="px-4 py-5 sm:p-6 text-center"
                             @click="select(t)"
                        >
                            <dt class="text-sm font-medium text-gray-500 truncate">
                                {{ t.name }} - USD
                            </dt>
                            <dd class="mt-1 text-3xl font-semibold text-gray-900">
                                {{ formatPrice(t.price) }}
                            </dd>
                        </div>
                        <div class="w-full border-t border-gray-200"></div>
                        <button @click="remove(t.name)"
                                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none">
                            <svg class="h-5 w-5"
                                 xmlns="http://www.w3.org/2000/svg"
                                 viewBox="0 0 20 20"
                                 fill="#718096"
                                 aria-hidden="true"
                            >
                                <path fill-rule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clip-rule="evenodd"
                                ></path>
                            </svg>
                            Удалить
                        </button>
                    </div>
                </dl>
                <hr class="w-full border-t border-gray-600 my-4"/>
            </template>

            <selected-ticker v-if="selected_ticker"
                             @clean-selected="selected_ticker = null"
                             :selected="selected_ticker" :graph="normalized_graph"
            />
        </div>
    </div>
</template>

<script>
import {setCurrencyCallbacks} from './storage';
import {loadFilterFromStorage, saveFilterToStorage, loadPageFromStorage, savePageToStorage} from './storage';
import {loadCurrenciesFromStorage, addCurrencyToStorage, removeCurrencyFromStorage} from './storage';
import {setTickerCallback, subscribeToTicker, unsubscribeFromTicker} from './api-sw-ws';

import AddTicker from '@/components/AddTicker';
import SelectedTicker from '@/components/SelectedTicker';

export default {
    name: 'App',

    components: {
        AddTicker,
        SelectedTicker,
    },

    data() {
        return {
            loading: true,
            filter: '',
            selected_ticker: null,
            max_graph_elements: 1,
            graph_element_width: 1,
            tickers: [],
            graph: [],
            error: false,
            page: 1,
        };
    },

    async created() {
        this.page = loadPageFromStorage();
        this.filter = loadFilterFromStorage();

        setTickerCallback(this.updateTicker);
        setCurrencyCallbacks(this.add, this.remove);

        loadCurrenciesFromStorage().forEach((currency) => {
            this.tickers.push({name: currency, price: '-'});
            subscribeToTicker(currency);
        });

        // выравнивание ширины графика
        setInterval(() => {
            this.tickers.filter((t) => t === this.selected_ticker).forEach((t) => {
                this.graph.push(t.price);

            // todo
            //    this.fixGraphWidth();
            });
        }, 2000);
    },

    mounted() {
        window.addEventListener('resize', this.calculateMaxGraphElements);
    },

    beforeUnmount() {
        window.removeEventListener('resize', this.calculateMaxGraphElements);
    },

    computed: {
        normalized_graph() {
            const max_value = Math.max(...this.graph);
            const min_value = Math.min(...this.graph);

            let result = [];

            for (let price of this.graph) {
                const height = min_value === max_value ? 50 : 5 + (price - min_value) * 95 / (max_value - min_value);

                result.push(height);
            }

            console.log(result);

            return result;
        },

        start_index() {
            return (this.page - 1) * 6;
        },

        end_index() {
            return this.page * 6;
        },

        filtered_tickers() {
            return this.tickers.filter(t => t.name.includes(this.filter.toUpperCase()));
        },

        paginated_tickers() {
            return this.filtered_tickers.slice(this.start_index, this.end_index);
        },

        has_next_page() {
            return this.filtered_tickers.length > this.end_index;
        },

        tooManyTickersAdded() {
            return this.tickers.length >= 3;
        },
    },

    watch: {
        filter(value) {
            this.page = 1;
            saveFilterToStorage(value);
        },

        page(value) {
            savePageToStorage(value);
        },

        paginated_tickers(value) {
            if (value.length === 0 && this.page > 1) {
                --this.page;
            }
        },

        selected_ticker() {
            this.graph = [];
            this.$nextTick(() => {
                this.calculateMaxGraphElements();
            });
        },
    },

    methods: {
        fixGraphWidth() {
            // todo refs

            if (this.$refs.graphElement && this.graph.length === 2) {
                this.graph_element_width = this.$refs.graphElement.clientWidth;
            }

            if (this.graph.length > this.max_graph_elements) {
                this.graph = this.graph.slice(this.graph.length - this.max_graph_elements);
            }
        },

        calculateMaxGraphElements() {
            if (!this.$refs.graph) {
                return;
            }

            this.max_graph_elements = Math.floor(this.$refs.graph.clientWidth / this.graph_element_width);

            // todo
            //this.fixGraphWidth();
        },

        formatPrice(price) {
            if (price === '-') {
                return price;
            }
            return price > 1 ? price.toFixed(2) : price.toPrecision(2);
        },

        updateTicker(ticker_name, price) {
            this.tickers.filter((t) => t.name === ticker_name).forEach((t) => {
                t.price = price;
            });
        },

        add(ticker) {
            if (this.tickers.find((t) => t.name === ticker)) {
                this.error = true;
                return;
            }

            const current_ticker = {name: ticker, price: '-'};

            this.tickers = [...this.tickers, current_ticker];

            subscribeToTicker(current_ticker.name);
            addCurrencyToStorage(current_ticker.name);

            this.filter = '';
            this.error = false;
        },

        remove(ticker_name) {
            this.tickers = this.tickers.filter((t) => t.name !== ticker_name);

            if (this.selected_ticker?.name === ticker_name) {
                this.selected_ticker = null;
            }

            unsubscribeFromTicker(ticker_name);
            removeCurrencyFromStorage(ticker_name);
        },

        select(ticker) {
            this.selected_ticker = ticker;
        },
    },
};
</script>
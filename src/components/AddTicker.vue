<template>
    <section>
        <div class="flex">
            <div class="max-w-xs">
                <label for="wallet" class="block text-sm font-medium text-gray-700">
                    Тикер
                </label>
                <div class="mt-1 relative rounded-md shadow-md">
                    <input id="wallet"
                           class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                           type="text"
                           name="wallet"
                           placeholder="Например DOGE"
                           @keydown="activity($event)"
                           v-model="ticker"
                    />
                </div>

                <div class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap" v-show="hints.length">
                <span class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
                      v-for="(h, idx) in hints" :key="idx"
                      @click="ticker = h; add(ticker)"
                >
                    {{ h }}
                </span>
                </div>

                <div class="text-sm text-red-600" v-show="error">
                    Такой тикер уже добавлен
                </div>
            </div>
        </div>

        <add-ticker-button @click="(ticker)" :disabled="disabled" class="my-4"/>
    </section>
</template>

<script>
import {loadCoinsFromApi} from '@/api';

import AddTickerButton from '@/components/AddTickerButton';

export default {
    name: 'AddTicker',

    components: {
        AddTickerButton,
    },

    props: {
        disabled: {
            type: Boolean,
            required: false,
            default: false,
        },

        error: {
            type: Boolean,
            required: true,
        },
    },

    emits: {
        'add-ticker': value => typeof value === 'string' && value.length > 0,
        'loading-complete': null,
    },

    data() {
        return {
            ticker: '',
            coins: [],
        };
    },

    computed: {
        hints() {
            const name = this.ticker.toUpperCase();

            if (!name.length) {
                return [];
            }

            let result = [];
            for (let c of this.coins) {
                if (c.name.toUpperCase().includes(name) || c.symbol.includes(name)) {
                    result.push(c.symbol);
                }

                if (result.length > 3) {
                    return result;
                }
            }
            return result;
        },
    },

    methods: {
        add(ticker_name) {
            const name = ticker_name.toUpperCase();

            if (name.length === 0) {
                return;
            }

            if (!this.coins.find((c) => c.symbol === name)) {
                return;
            }

            this.ticker = '';

            if (this.disabled) {
                return;
            }

            this.$emit('add-ticker', name);
        },

        activity(event) {
            this.$emit('clean-error');
            if (event.key === 'Enter') {
                this.add(this.ticker);
            }
        },
    },

    async created() {
        this.coins = await loadCoinsFromApi();

        this.$emit('loading-complete');
    },
};
</script>

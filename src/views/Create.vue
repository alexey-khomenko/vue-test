<template>
  <div class="container">
    <div class="row">
      <div class="col s6 offset-s3">
        <h1>Create task</h1>

        <form @submit.prevent="createTask">
          <div class="input-field">
            <input id="title" type="text" class="validate" required="required" v-model="title"/>
            <label for="title">Title</label>
            <span class="helper-text" data-error="Title is required"></span>
          </div>

          <div class="input-field">
            <div class="chips" ref="chips"></div>
          </div>

          <div class="input-field">
            <textarea id="description" class="materialize-textarea" v-model="description"></textarea>
            <label for="description">Description</label>
            <span class="character-counter" style="float: right; font-size: 12px;">{{ description.length }}/2048</span>
          </div>

          <div class="input-field">
            <input id="datepicker" type="text" ref="datepicker"/>
            <label for="datepicker">Deadline</label>
          </div>

          <button type="submit" class="btn">Create task</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Create',
  data() {
    return {
      title: '',
      description: '',
      date: null,
      chips: null,
    }
  },
  methods: {
    createTask() {
      const task = {
        id: Date.now(),
        title: this.title,
        description: this.description,
        deadline: this.date.date,
        tags: this.chips.chipsData,
        status: 'active',
      }
      this.$store.dispatch('createTask', task)
      this.$router.push('/')
    }
  },
  mounted() {
    this.chips = M.Chips.init(this.$refs.chips, {
      placeholder: 'Task tags'
    })
    this.date = M.Datepicker.init(this.$refs.datepicker, {
      format: 'dd.mm.yyyy',
      defaultDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      setDefaultDate: true,
    })
  },
  unmounted() {
    if (this.date && this.date.destroy) {
      this.date.destroy()
    }

    if (this.chips && this.chips.destroy) {
      this.chips.destroy()
    }
  },
}
</script>
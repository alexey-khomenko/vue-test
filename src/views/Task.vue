<template>
  <div class="container" v-if="task">
    <div class="row">
      <div class="col s6 offset-s3">
        <h1>{{ task.title }}</h1>

        <form @submit.prevent="updateTask">
          <div class="input-field">
            <div class="chips" ref="chips"></div>
          </div>

          <div class="input-field">
            <textarea id="description" class="materialize-textarea"
                      v-model="description" :disabled="task.status === 'completed'"></textarea>
            <label for="description">Description</label>
            <span class="character-counter" style="float: right; font-size: 12px;">{{ description.length }}/2048</span>
          </div>

          <div class="input-field">
            <input id="datepicker" type="text" ref="datepicker" :disabled="task.status === 'completed'"/>
            <label for="datepicker">Deadline</label>
          </div>

          <div v-if="task.status !== 'completed'">
            <button type="submit" class="btn" style="margin-right: 1rem;">Save task</button>
            <button type="button" class="btn" @click="completeTask">Complete task</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Task',
  data() {
    return {
      description: '',
      date: null,
      chips: null,
    }
  },
  methods: {
    updateTask() {
      const task = {
        id: this.task.id,
        description: this.description,
        deadline: this.date.date,
      }
      this.$store.dispatch('updateTask', task)
      this.$router.push('/')
    },
    completeTask() {
      this.$store.dispatch('completeTask', this.task.id)
      this.$router.push('/')
    }
  },
  computed: {
    task() {
      // todo 404
      // todo в какой момент получать данные?
      const task = this.$store.getters.taskById(+this.$route.params.id)
      if (!task) this.$router.push('/404')
      return task;
    }
  },
  mounted() {
    if (!this.task) return;

    this.description = this.task.description
    this.chips = M.Chips.init(this.$refs.chips, {
      placeholder: 'Task tags',
      data: this.task.tags
    })
    this.date = M.Datepicker.init(this.$refs.datepicker, {
      format: 'dd.mm.yyyy',
      defaultDate: new Date(this.task.deadline),
      setDefaultDate: true
    })
    setTimeout(() => {
      M.updateTextFields()
      M.textareaAutoResize(document.getElementById('description'))
    }, 0)
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
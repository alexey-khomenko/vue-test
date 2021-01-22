<template>
  <div class="container">
    <h1>Tasks</h1>

    <div class="row">
      <div class="input-field col s6">
        <select id="filterEl" ref="filter" v-model="value">
          <option value="" disabled selected></option>
          <option value="active">Active</option>
          <option value="outdated">Outdated</option>
          <option value="completed">Completed</option>
        </select>
        <label for="filterEl">Status filter</label>
      </div>
      <div class="col s6" v-if="value.length">
        <button type="button" class="btn" @click="value = ''">Reset</button>
      </div>
    </div>

    <table v-if="tasks.length">
      <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Date</th>
        <th>Description</th>
        <th>Status</th>
        <th>Open</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(task, i) in showTasks" :key="i">
        <td>{{ i + 1 }}</td>
        <td>{{ task.title }}</td>
        <td>{{ new Date(task.deadline).toLocaleDateString() }}</td>
        <td>
          <div class="desc">{{ task.description }}</div>
        </td>
        <td>{{ task.status }}</td>
        <td>
          <router-link class="btn btn-small" :to="'/task/' + task.id">Open</router-link>
        </td>
      </tr>
      </tbody>
    </table>
    <p v-else>No tasks</p>
  </div>
</template>

<script>
export default {
  name: 'Tasks',
  data() {
    return {
      filter: null,
      value: '',
    }
  },
  computed: {
    tasks() {
      return this.$store.getters.tasks
    },
    showTasks() {
      return this.tasks.filter(task => {
        if (!this.value.length) return true

        return task.status === this.value
      })
    }
  },
  mounted() {
    this.filter = M.FormSelect.init(this.$refs.filter, {})
  },
  unmounted() {
    if (this.filter && this.filter.destroy) {
      this.filter.destroy()
    }
  },
}
</script>

<style scoped>
.desc {
  max-width: 200px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
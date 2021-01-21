import {createStore} from 'vuex'

export default createStore({
    state: {
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]').map(task => {
            if (new Date(task.deadline) < new Date()) task.status = 'outdated'

            return task;
        })
    },
    mutations: {
        createTask(state, task) {
            state.tasks.push(task)

            localStorage.setItem('tasks', JSON.stringify(state.tasks))
        },
        updateTask(state, {id, description, deadline}) {
            const i = state.tasks.findIndex(task => task.id === id)

            state.tasks[i].deadline = deadline
            state.tasks[i].description = description
            state.tasks[i].status = new Date(deadline) > new Date ? 'active' : 'outdated'

            localStorage.setItem('tasks', JSON.stringify(state.tasks))
        },
        completeTask(state, id) {
            const i = state.tasks.findIndex(task => task.id === id)

            state.tasks[i].status = 'completed'

            localStorage.setItem('tasks', JSON.stringify(state.tasks))
        }
    },
    actions: {
        createTask({commit}, task) {
            commit('createTask', task)
        },
        updateTask({commit}, task) {
            commit('updateTask', task)
        },
        completeTask({commit}, id) {
            commit('completeTask', id)
        }
    },
    getters: {
        tasks: store => store.tasks,
        taskById: store => function (id) {
            return store.tasks.find(task => task.id === id)
        }
    },
    modules: {}
})

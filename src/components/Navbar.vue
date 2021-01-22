<template>
  <nav>
    <div class="nav-wrapper">
      <div class="container">
        <span class="brand-logo">Tasks app</span>
        <ul id="nav-mobile" class="right hide-on-med-and-down">
          <router-link custom v-slot="{ href, navigate, isActive }" to="/">
            <li :class="{active: isActive}">
              <a :href="href" @click="navigate">Tasks</a>
            </li>
          </router-link>
          <router-link custom v-slot="{ href, navigate, isActive }" to="/create">
            <li :class="{active: isActive}">
              <a :href="href" @click="navigate">Create</a>
            </li>
          </router-link>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: "Navbar"
}
</script>
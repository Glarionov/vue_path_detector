<template>
  <div id="app">
    <div id="nav">
      <router-link to="/" title="Загрузка файла(реализация ТЗ)">Загрузка файла(реализация ТЗ)</router-link>
      <router-link to="/testing" title="Тестирование">Тестирование</router-link>
      <router-link to="/about" title="Описание работы">Описание работы</router-link>

    </div>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #b7aea2;
}

#nav {
  padding: 30px;
  font-size: 22px;
}

#nav a {
  font-weight: bold;
  color: #f5deb1;
  margin: 0px 15px;
}

#nav a.router-link-exact-active {
  color: #ffa200;
}

body {
  background: #292823;
}
</style>

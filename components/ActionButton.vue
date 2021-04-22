<template>
  <div class="d-flex justify-center" style="margin-top: 32px;">
    <v-speed-dial v-model="fab" direction="bottom" transition="slide-y-transition" bottom>
      <template v-slot:activator>
        <v-btn v-model="fab" color="blue darken-2" dark fab>
          <v-icon v-if="fab">
            mdi-close
          </v-icon>
          <v-icon v-else>
            mdi-pencil
          </v-icon>
        </v-btn>
      </template>
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" @click="onClickAction('notification')" fab dark small color="indigo">
            <v-icon>mdi-bulletin-board</v-icon>
          </v-btn>
        </template>
        <span>Notification</span>
      </v-tooltip>
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" @click="onClickAction('diet')" fab dark small color="green">
            <v-icon>mdi-silverware-fork-knife</v-icon>
          </v-btn>
        </template>
        <span>Diet</span>
      </v-tooltip>
      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" @click="onClickAction('background')" fab dark small color="red">
            <v-icon>mdi-wallpaper</v-icon>
          </v-btn>
        </template>
        <span>Background</span>
      </v-tooltip>
    </v-speed-dial>
  </div>
</template>

<script>
export default {
  props: {
    callback: Function,
  },
  data() {
    return {
      fab: false,
    }
  },
  methods: {
    onClickAction(action) {
      this.callback && this.callback(action)
    },
  },
}
</script>

<style lang="sass" scoped></style>pencil

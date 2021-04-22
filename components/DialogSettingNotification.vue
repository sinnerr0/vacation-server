<template>
  <div>
    <v-dialog v-model="value" max-width="500" @click:outside="close">
      <v-card class="ma-0">
        <v-card-title>Diet Setting</v-card-title>
        <v-card-text>
          <v-text-field v-model="message" label="Notification"></v-text-field>
          <v-text-field v-model="key" label="Change Key Code"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn @click="onClickChange" color="primary" text>Notify</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <Loading v-model="loading"></Loading>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    notification: String,
    callback: {
      type: Function,
    },
  },
  data() {
    return {
      loading: false,
      message: '',
      key: '',
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.loading = false
        this.message = this.notification
        this.key = ''
      }
    },
  },
  methods: {
    async onClickChange() {
      try {
        this.loading = true
        await this.$axios.post(`${process.env.NUXT_ENV_APP_SERVER}api/noti`, {
          key: this.key,
          message: this.message,
        })
        this.callback(true)
      } catch (e) {
        this.callback(false)
      } finally {
        this.close()
      }
    },
    close() {
      this.loading = false
      this.$emit('input', false)
    },
  },
}
</script>

<style lang="sass" scoped></style>

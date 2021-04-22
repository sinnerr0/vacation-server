<template>
  <div>
    <v-dialog v-model="value" max-width="500" @click:outside="close">
      <v-card class="ma-0">
        <v-card-title>Background Setting</v-card-title>
        <v-card-text>
          <v-file-input v-model="backgroundImage" label="Image File Input"></v-file-input>
          <v-text-field v-model="backgroundKey" label="Change Key Code"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn @click="onClickChange" :disabled="!backgroundImage || !backgroundKey" color="primary" text>Change</v-btn>
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
    callback: {
      type: Function,
    },
  },
  data() {
    return {
      loading: false,
      backgroundImage: null,
      backgroundKey: '',
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.loading = false
        this.backgroundImage = null
        this.backgroundKey = ''
      }
    },
  },
  methods: {
    async onClickChange() {
      let form = new FormData()
      form.append('image', this.backgroundImage)
      form.append('key', this.backgroundKey)
      try {
        this.loading = true
        await this.$axios.post(`${process.env.NUXT_ENV_APP_SERVER}api/background`, form)
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

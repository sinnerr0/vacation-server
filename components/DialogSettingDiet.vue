<template>
  <div>
    <v-dialog v-model="value" max-width="500" @click:outside="close">
      <v-card class="ma-0">
        <v-card-title>Diet Setting</v-card-title>
        <v-card-text>
          <v-file-input v-model="pdf" accept="application/pdf" label="PDF File Input"></v-file-input>
          <v-text-field v-model="key" label="Change Key Code"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="close" text>Cancel</v-btn>
          <v-btn @click="onClickChange" :disabled="!pdf || !key" color="primary" text>Change</v-btn>
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
      pdf: null,
      key: '',
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.loading = false
        this.pdf = null
        this.key = ''
      }
    },
  },
  methods: {
    async onClickChange() {
      let form = new FormData()
      form.append('pdf', this.pdf)
      form.append('key', this.key)
      try {
        this.loading = true
        await this.$axios.post(`${process.env.NUXT_ENV_APP_SERVER}api/diet`, form)
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

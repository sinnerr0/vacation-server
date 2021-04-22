<template>
  <v-dialog v-model="value" max-width="500" hide-overlay persistent>
    <v-card color="primary" class="ma-0" dark>
      <v-card-text>
        Please stand by
        <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style></style>

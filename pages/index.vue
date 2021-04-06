<template>
  <v-app :style="appStyle">
    <v-app-bar app color="white" dark>
      <div class="d-flex align-center">
        <h1 class="text-h4 black--text">Alchera Dashboard</h1>
      </div>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-card v-if="salaryDday !== null">
          <v-card-title v-if="salaryDday === 0">Salary Today<v-icon>mdi-currency-usd</v-icon></v-card-title>
          <v-card-title v-else>Salary D{{ salaryDday }}</v-card-title>
        </v-card>

        <v-card :loading="loading">
          <v-card-title>Today</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item v-if="!loading && !vacation.vacationTodayList.length">
                  <v-list-item-content>
                    <v-list-item-title>오늘은 휴가자가 없습니다.</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item v-for="(member, i) in vacation.vacationTodayList" :key="i">
                  <v-list-item-icon>
                    <v-avatar color="indigo">
                      <img v-if="member.member_image" :src="member.member_image" :alt="member.member_name" />
                      <span v-else class="white--text headline">{{ member.member_name.substring(0, 1) }}</span>
                    </v-avatar>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-text="member.member_name"></v-list-item-title>
                    <v-list-item-subtitle>{{ `${member.start_date} ~ ${member.finish_date}` }} [{{ member.form_custum_field_name }}]</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Weekly</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item v-for="(info, i) in vacation.vacationWeekList" :key="i">
                  <v-list-item-icon>
                    <div style="width:100px">{{ info.date }}</div>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title v-for="(member, i) in info.member" :key="i" v-text="`${member.name} [${member.kind}]`"></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Diet</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item>
                  <v-list-item-content>
                    <img :src="diet" width="100%" alt="diet" />
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="onClickChangeDiet" :disabled="!pdf || !key" style="margin-right:10px;">Change</v-btn>
            <v-text-field v-model="key" label="Change Key Code"></v-text-field>
            <v-file-input v-model="pdf" accept="application/pdf" label="PDF File Input" truncate-length="100"></v-file-input>
          </v-card-actions>
        </v-card>

        <v-card>
          <v-card-title>Background</v-card-title>
          <v-card-actions>
            <v-btn @click="onClickChangeBackground" :disabled="!backgroundImage || !backgroundKey" style="margin-right:10px;">Change</v-btn>
            <v-text-field v-model="backgroundKey" label="Change Key Code"></v-text-field>
            <v-file-input v-model="backgroundImage" label="Image File Input" truncate-length="100"></v-file-input>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import * as dateFns from 'date-fns'

export default {
  data() {
    return {
      loading: false,
      salaryDday: null,
      vacation: { vacationTodayList: [], vacationWeekList: [] },
      diet: '',
      pdf: null,
      key: '',
      background: `${process.env.NUXT_ENV_APP_SERVER}background`,
      backgroundImage: null,
      backgroundKey: '',
      timerObj: null,
    }
  },
  computed: {
    appStyle() {
      let style = ''
      if (this.background) {
        style += `background: url(${this.background});`
      }
      return style
    },
  },
  async created() {
    await this.getSalaryDday()
    await this.getVacation()
    this.startTimer()
  },
  destroyed() {
    clearInterval(this.timerObj)
  },
  methods: {
    async getVacation() {
      this.loading = true
      this.diet = ''
      try {
        const { data } = await this.$axios.get(`${process.env.NUXT_ENV_APP_SERVER}vacation.json`)
        data.vacationTodayList = data.vacationTodayList.filter(member => !!member.member_name)
        for (let i = 0, j = data.vacationWeekList.length; i < j; i++) {
          data.vacationWeekList[i].member = data.vacationWeekList[i].member.filter(member => !!member.name)
        }
        this.vacation = data
        this.diet = `${process.env.NUXT_ENV_APP_SERVER}diet.png?nocache=${Date.now()}`
        this.background = `${process.env.NUXT_ENV_APP_SERVER}background?nocache=${Date.now()}`
      } finally {
        this.loading = false
      }
    },
    async onClickChangeDiet() {
      this.diet = ''
      let form = new FormData()
      form.append('pdf', this.pdf)
      form.append('key', this.key)
      try {
        await this.$axios.post(`${process.env.NUXT_ENV_APP_SERVER}api/diet`, form)
        this.diet = `${process.env.NUXT_ENV_APP_SERVER}diet.png?nocache=${Date.now()}`
      } catch (e) {
        // nothing
      }
    },
    async onClickChangeBackground() {
      this.background = ''
      let form = new FormData()
      form.append('image', this.backgroundImage)
      form.append('key', this.backgroundKey)
      try {
        await this.$axios.post(`${process.env.NUXT_ENV_APP_SERVER}api/background`, form)
        this.background = `${process.env.NUXT_ENV_APP_SERVER}background?nocache=${Date.now()}`
      } catch (e) {
        // nothing
      }
    },
    async getSalaryDday() {
      try {
        this.salaryDday = null
        let date = new Date()
        const today = parseInt(dateFns.format(date, 'dd'))
        let salaryDay = await this.getSalaryday()
        if (salaryDay < today) {
          date = dateFns.add(date, { months: 1 })
          salaryDay = await this.getSalaryday(true)
          date.setDate(salaryDay)
          this.salaryDday = dateFns.differenceInCalendarDays(new Date(), date)
        } else if (salaryDay > today) {
          this.salaryDday = today - salaryDay
        } else {
          this.salaryDday = 0
        }
      } catch (e) {
        // nothing
      }
    },
    async getHolidaysMap(isNextMonth = false) {
      let holidayDaysMap = new Map()
      try {
        // https://data.go.kr/ expired date = 2023-03-16
        const url = isNextMonth
          ? `${process.env.NUXT_ENV_APP_SERVER}holidayNextMonth.json`
          : `${process.env.NUXT_ENV_APP_SERVER}holidayThisMonth.json`
        let { data } = await this.$axios.get(url)
        if (data.response && data.response.header && data.response.header.resultCode === '00') {
          const totalCount = data.response.body.totalCount
          const items = data.response.body.items.item
          if (totalCount > 0) {
            const holiday = []
            if (items instanceof Array) {
              for (let i = 0, j = items.length; i < j; i++) {
                const item = items[i]
                if (item.isHoliday) {
                  holiday.push(item)
                }
              }
            } else if (items.isHoliday) {
              holiday.push(items)
            }
            holiday.forEach(day => {
              holidayDaysMap.set(parseInt(('' + day.locdate).substr(-2)), day.locdate)
            })
          }
        }
      } catch (e) {
        // nothing
      }
      return holidayDaysMap
    },
    async getSalaryday(isNextMonth = false) {
      const holidayDaysMap = await this.getHolidaysMap(isNextMonth)
      let salaryDay = 21
      let date = new Date()
      if (isNextMonth) {
        date = dateFns.add(date, { months: 1 })
      }
      date.setDate(salaryDay)
      let searching = true
      while (searching) {
        if (dateFns.isSunday(date)) {
          date.setDate(salaryDay - 2)
        } else if (dateFns.isSaturday(date)) {
          date.setDate(salaryDay - 1)
        }
        salaryDay = date.getDate()
        if (holidayDaysMap.has(date.getDate())) {
          date.setDate(salaryDay - 1)
        } else {
          searching = false
        }
      }
      return salaryDay
    },
    startTimer() {
      const ONE_HOUR = 60 * 60 * 1000
      this.timerObj = setInterval(async () => {
        await this.getSalaryDday()
        await this.getVacation()
      }, ONE_HOUR)
    },
  },
}
</script>

<style>
.v-card {
  max-width: 500px !important;
  margin: 10px auto !important;
}
</style>

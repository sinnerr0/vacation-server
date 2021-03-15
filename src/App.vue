<template>
  <v-app>
    <v-app-bar app color="white" dark>
      <div class="d-flex align-center">
        <h1 class="text-h4 black--text">Alchera Dashboard</h1>
      </div>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-card :loading="loading">
          <v-card-title>Today</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item
                  v-if="!loading && !vacation.vacationTodayList.length"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      >오늘은 휴가자가 없습니다.</v-list-item-title
                    >
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-for="(member, i) in vacation.vacationTodayList"
                  :key="i"
                >
                  <v-list-item-icon>
                    <v-avatar color="indigo">
                      <img
                        v-if="member.member_image"
                        :src="member.member_image"
                        :alt="member.member_name"
                      />
                      <span v-else class="white--text headline">{{
                        member.member_name.substring(0, 1)
                      }}</span>
                    </v-avatar>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title
                      v-text="member.member_name"
                    ></v-list-item-title>
                    <v-list-item-subtitle>{{
                      `${member.start_date} ~ ${member.finish_date}`
                    }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card style="margin-top: 10px">
          <v-card-title>Weekly</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item
                  v-for="(info, i) in vacation.vacationWeekList"
                  :key="i"
                >
                  <v-list-item-icon>
                    <div style="width:100px">{{ info.date }}</div>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title
                      v-for="(member, i) in info.member"
                      :key="i"
                      v-text="`${member.name} [${member.kind}]`"
                    ></v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card style="margin-top: 10px">
          <v-card-title>Diet</v-card-title>
          <v-card-text>
            <v-list disabled>
              <v-list-item-group color="primary">
                <v-list-item>
                  <v-list-item-content>
                    <img :src="diet" width="100%" alt="diet"/>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn
              @click="onClickChangeDiet"
              :disabled="!pdf || !key"
              style="margin-right:10px;"
              >Change</v-btn
            >
            <v-text-field v-model="key" label="Change Key Code"></v-text-field>
            <v-file-input
              v-model="pdf"
              accept="application/pdf"
              label="PDF File Input"
              truncate-length="100"
            ></v-file-input>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      loading: false,
      vacation: { vacationTodayList: [], vacationWeekList: [] },
      diet: `${process.env.VUE_APP_SERVER}diet.png`,
      pdf: null,
      key: "",
      timerObj: null,
    };
  },
  async created() {
    await this.getVacation();
    this.startTimer();
  },
  destroyed() {
    clearInterval(this.timerObj);
  },
  methods: {
    async getVacation() {
      this.loading = true;
      try {
        const { data } = await axios.get(
          `${process.env.VUE_APP_SERVER}vacation.json`
        );
        data.vacationTodayList = data.vacationTodayList.filter(
          (member) => !!member.member_name
        );
        for (let i = 0, j = data.vacationWeekList.length; i < j; i++) {
          data.vacationWeekList[i].member = data.vacationWeekList[
            i
          ].member.filter((member) => !!member.name);
        }
        this.vacation = data;
      } finally {
        this.loading = false;
      }
    },
    async onClickChangeDiet() {
      this.diet = "";
      let form = new FormData();
      form.append("pdf", this.pdf);
      form.append("key", this.key);
      try {
        await axios.post(`${process.env.VUE_APP_SERVER}api/diet`, form);
      } finally {
        this.diet = `${process.env.VUE_APP_SERVER}diet.png`;
      }
    },
    startTimer() {
      const ONE_HOUR = 60 * 60 * 1000;
      this.timerObj = setInterval(async () => {
        await this.getVacation();
      }, ONE_HOUR);
    },
  },
};
</script>

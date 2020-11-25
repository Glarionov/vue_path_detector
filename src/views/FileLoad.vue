<template>
  <div class="home">
    <Core
        ref="mainCanvasComponent"
        :circlesToShow="circlesToShow"
        :linesToShow="linesToShow"
        :textsToShow="textsToShow"
        :message="message"
        :receivers="receivers"
        :testing="false">
      <template v-slot:infoBlockText>
        <input type="file" ref="myFile" @change="selectedFile"><br/>
        <div v-if="Object.keys(signals).length" class="btn" @click="showLine">Нажмите на кнопку, чтобы отобразить траекторию</div>
        <div class="info-for-file">
          <p v-for="(text, index) in infoForFile" :key="index">
            {{text}}
          </p>
        </div>
      </template>

    </Core>
  </div>
</template>

<script>
import Core from "@/components/Core";

export default {
  name: 'Home',
  components: {
    Core
  },
  data: function () {
    return {
      circlesToShow: {},
      linesToShow: {},
      textsToShow: {},
      receivers: {},
      fileForms: {length: 0},
      message: '',
      text: '',
      infoForFile: [],
      signals: {}
    }
  },
  mounted() {

  },
  methods:{
    selectedFile() {
      let file = this.$refs.myFile.files[0];
      if(!file || file.type !== 'text/plain') return;

      // Credit: https://stackoverflow.com/a/754398/52160
      let reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload =  evt => {

        let text = evt.target.result;
        this.text = text;

        let splitByLines = text.split('\n');

        let splitedLine = splitByLines[0].split(',');
        this.receivers = {
          1: {
            x: parseInt(splitedLine[0]),
            y: parseInt(splitedLine[1]),
            radius: 40,
            fill: "red",
            stroke: "black",
            strokeWidth: 20
          },
          2: {
            x: parseInt(splitedLine[2]),
            y: parseInt(splitedLine[3]),
            radius: 40,
            fill: "green",
            stroke: "black",
            strokeWidth: 20
          },
          3: {
            x: parseInt(splitedLine[4]),
            y: parseInt(splitedLine[5]),
            radius: 40,
            fill: "blue",
            stroke: "black",
            strokeWidth: 20
          }
        };

        let amountOfLines = splitByLines.length;

        let t = 0;
        let signals = {};
        for (let i = 1; i < amountOfLines; i++) {
          let line = splitByLines[i];
            if (!line.length) {
              continue;
            }

          splitedLine = splitByLines[i].split(',');

            if (splitedLine.length < 2) {
              continue;
            }

            t++;
            signals[t] = {
              1: [parseFloat(splitedLine[0])],
              2: [parseFloat(splitedLine[1])],
              3: [parseFloat(splitedLine[2])]
            };
        }
        this.signals = signals;
      }

    },
    showLine() {
      if (this.signals) {
        this.$refs.mainCanvasComponent.countData(this.receivers, this.signals);
      }
    }
  }
}
</script>

<style scoped>
  .btn {
    background: brown;
    padding: 10px;
  }

  .btn:hover {
    cursor: pointer;
    background: #f30707;
  }
</style>

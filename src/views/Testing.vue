<template>
  <div>
    <Core
        ref="mainCanvasComponent"
        :circlesToShow="circlesToShow"
        :linesToShow="linesToShow"
        :textsToShow="textsToShow"
        :message="message"
        :receivers="receivers"
        :realPoints="realPoints"
        :testing="true"
    >

      <template v-slot:infoBlockText>
        <div class="info-for-file">
          <p v-for="(text, index) in infoForFile" :key="index">
            {{ text }}
          </p>
        </div>
      </template>

    </Core>

  </div>
</template>
<script>

import Core from "@/components/Core";

var solveQuadraticEquation = require('solve-quadratic-equation');
var centroid = require('triangle-centroid')

export default {
  components: {
    Core
    // Test
  },
  name: "Dist",
  data: function () {
    return {
      infoForFile: ['Данные ниже можно использовать для загрузки файла в основном режиме:'],
      mainCanvas: "abc",
      leftestPoint: 0,
      message: '',
      rightTestPoint: window.innerWidth,
      highestPoint: 0,
      lowestPoint: window.innerHeight,
      averageError: 0,
      // Имитированное время всех процессов - и движения передатчика и сбора сигналов
      amountOfSeconds: 40,
      // Моменты времени, в которые передатчик изменит своё направление
      turnMoments: [10, 20, 30],
      // turnMoments: [],
      startX: Math.floor(-1000 + Math.random() * 2000),
      startY: Math.floor(-1000 + Math.random() * 2000),
      horizontalSpeed: Math.floor((30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1)),
      verticalSpeed: Math.floor((30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1)),

      turnTime: 5,
      /**
       * Объекты, отображающие точки, в которых реально был приёмник
       */
      realPoints: {},
      /**
       * Искажение сигнала, который получает приёмник,
       * Выражаемое в плюс-минус доле от полученного сигнала.
       * Например, при значении этого параметра 0.5 и времени пути сигнала 10 секунд,
       * может исказить получаемоу время до диапазона от 5 до 15 секунд
       */
      receiverRelativeError: 0,
      /**
       * Искажение сигнала, выражаемое в басолютном количестве секунд
       */
      receiverAbsoluteError: 0,
      circlesToShow: {},
      linesToShow: {},
      textsToShow: {},
      circlesToShowAfterDrawStarts: {},
      linesToShowAfterDrawStarts: {},
      receivers: {
        1: {
          x: Math.floor(-333 + Math.random() * 400),
          y: Math.floor(-333 + Math.random() * 300),
          radius: 40,
          fill: "red",
          stroke: "black",
          strokeWidth: 20
        },
        2: {
          x: Math.floor(1211 + Math.random() * 500),
          y: Math.floor(-1000 + Math.random() * 500),
          radius: 40,
          fill: "green",
          stroke: "black",
          strokeWidth: 20
        },
        3: {
          x: Math.floor(-333 + Math.random() * 400),
          y: Math.floor(1000 + Math.random() * 2000),
          radius: 40,
          fill: "blue",
          stroke: "black",
          strokeWidth: 20
        },
      },
      foundPoints: {},
      rads: {},
      car: {
        x: 0, y: 0, hs: 1000, vs: 0
      },
      configKonva: {
        width: 100,
        height: 100,
      },
      result: '',
      signalSpeed: 1000,
      pathLinePoints: [],
      mainTopOffset: 0,
      mainLeftOffset: 0,
      boxWidth: 0,
      boxHeight: 0
    }
  },
  mounted() {
    this.start();
  },
  methods: {

    start() {

      this.realPoints = {};

      this.infoForFile = ['Данные ниже можно использовать для загрузки файла в основном режиме:'];
      this.generateReceivers();

      let info = '';
      for (let id = 1; id < 4; id++) {
        info += this.receivers[id].x + ',' + this.receivers[id].y + ',';
      }

      this.infoForFile.push(info);

      this.$refs.mainCanvasComponent.refresh();
      this.$refs.mainCanvasComponent.setRightestPoint(this.receivers[1].x);
      this.$refs.mainCanvasComponent.setLeftestPoint(this.receivers[1].x);
      this.$refs.mainCanvasComponent.setHighestPoint(this.receivers[1].y);
      this.$refs.mainCanvasComponent.setLowestPoint(this.receivers[1].y);

      this.countPathBySpeedAndCheckIt();
    },

    generateReceivers() {

      let colors = {1: 'red', 2: 'green', 3: 'blue'};

      for (let id = 1; id < 4; id++) {
        this.receivers[id] = {
          x: Math.floor(-2000 + Math.random() * 4000),
          y: Math.floor(-2000 + Math.random() * 4000),
          radius: 40,
          fill: colors[id],
          stroke: "black",
          strokeWidth: 20
        }
      }
    },


    /**
     * Вычисляет время, которое преодолеет сигнал, прежде чем попадёт к приёмнику
     *
     * @param receiverX   X-координата приёмника
     * @param receiverY   Y-координата приёмника
     * @param totalTime   Время в секундах, в которое сигнал попадает к приёмнику
     * @returns {[]}
     */
    countSignalTimeForCertainSecond(receiverX, receiverY, totalTime) {

      let x0 = this.startX;
      let y0 = this.startY;
      let v = this.verticalSpeed;
      let h = this.horizontalSpeed;
      let ss = this.signalSpeed;

      /*
        Для того, чтобы вычислить, какое количество времени должен линейно двигаться приёмник, прежде чем испустить сигнал,
        чтобы суммарное время движения приёмника и сигнала составляло totalTime, необходимо составить квадратное уравнение
        в переменные a, b и с записываются соответствующие коэфиценты
       */
      let a = (h * h + v * v - ss * ss);
      let b = (2 * x0 * h - 2 * h * receiverX + 2 * y0 * v - 2 * v * receiverY + 2 * totalTime * ss * ss);
      let c = -1 * (totalTime * totalTime * ss * ss - x0 * x0 - receiverX * receiverX + 2 * x0 * receiverX - y0 * y0 - receiverY * receiverY + 2 * y0 * receiverY);

      let roots = solveQuadraticEquation(a, b, c);

      let answers = [];

      /*
        Заведомо иключаются ситуации, кога приёмник двигался отрицательное время, или время большее, чем totalTime
       */
      for (let transmitterTravelTime of roots) {
        if (transmitterTravelTime > 0 && transmitterTravelTime < totalTime && totalTime - transmitterTravelTime > 0) {
          let signalTime = totalTime - transmitterTravelTime;

          /*
            Учитывается погрешность, если она была задана, при этом не допускается невероятных ситуаций
           */
          if (this.receiverRelativeError || this.receiverAbsoluteError) {
            let signalTimeWithError = signalTime * (1 - this.receiverRelativeError + this.receiverRelativeError * 2 * Math.random())
                - this.receiverAbsoluteError + this.receiverAbsoluteError * 2 * Math.random();

            if (signalTimeWithError < 0.01) {
              signalTimeWithError = 0.01;
            }

            if (signalTimeWithError > totalTime - 0.01) {
              signalTimeWithError = totalTime - 0.01;
            }

            answers.push(signalTimeWithError);
          } else {
            answers.push(signalTime);
          }
        }
      }


      return answers;
    },

    changeTransmitterDirection(turnPointKey) {
      let turnMoment = this.turnMoments[turnPointKey];
      let newHorizontalSpeed = -40 + Math.random() * 80;
      this.startX = this.startX + turnMoment * this.horizontalSpeed - turnMoment * newHorizontalSpeed;
      this.horizontalSpeed = newHorizontalSpeed;

      let newVerticalSpeed = -30 + Math.random() * 60;
      this.startY = this.startY + turnMoment * this.verticalSpeed - turnMoment * newVerticalSpeed;
      this.verticalSpeed = newVerticalSpeed;
    },

    countPathBySpeedAndCheckIt() {

      let ansersByTime = {};


      let turnPointMinus = 0;

      this.realPoints[0] = {
        x: this.startX,
        y: this.startY,
      };

      this.$refs.mainCanvasComponent.addCircleToDraw(this.startX, this.startY, 44, 2,
          'real_point_0',
          {fill: 'red', strokeWidth: 2, stroke: 'black', opacity: 0.8},);

      let ansersByTimeAndTurnPoint = {};

      for (let turnPointKey = 0; turnPointKey <= this.turnMoments.length; turnPointKey++) {
        ansersByTimeAndTurnPoint[turnPointKey] = {};
        for (let passedSeconds = 1; passedSeconds < 40; passedSeconds++) {


          let timeToCalc = passedSeconds - turnPointMinus;


          if (!this.turnMoments.hasOwnProperty(turnPointKey) || passedSeconds < this.turnMoments[turnPointKey]) {

            if (!this.realPoints.hasOwnProperty(passedSeconds)) {
              let realPointX = this.startX + timeToCalc * this.horizontalSpeed;
              let realPointY = this.startY + timeToCalc * this.verticalSpeed;


              this.realPoints[passedSeconds] = {
                x: realPointX,
                y: realPointY,
              };

              this.$refs.mainCanvasComponent.addCircleToDraw(realPointX, realPointY, 44, 2,
                  'real_point_' + passedSeconds,
                  {fill: 'red', strokeWidth: 2, stroke: 'black', opacity: 0.8}, 'R' + passedSeconds);
            }

          }

          ansersByTimeAndTurnPoint[turnPointKey][passedSeconds] =
              {
                1:
                    this.countSignalTimeForCertainSecond(this.receivers[1].x, this.receivers[1].y, timeToCalc),
                2:
                    this.countSignalTimeForCertainSecond(this.receivers[2].x, this.receivers[2].y, timeToCalc),
                3:
                    this.countSignalTimeForCertainSecond(this.receivers[3].x, this.receivers[3].y, timeToCalc),
              };
        }

        this.changeTransmitterDirection(turnPointKey);
      }

      let synnteticAnsersByTime = {};

      for (let turnPointKey in ansersByTimeAndTurnPoint) {
        let answersByThisTurnPoint = ansersByTimeAndTurnPoint[turnPointKey];
        for (let passedSeconds in answersByThisTurnPoint) {
          if ((!this.turnMoments.hasOwnProperty(turnPointKey) || passedSeconds <= this.turnMoments[turnPointKey]) && !synnteticAnsersByTime.hasOwnProperty(passedSeconds)) {
            synnteticAnsersByTime[passedSeconds] = answersByThisTurnPoint[passedSeconds];
          }
        }
      }

      this.$refs.mainCanvasComponent.countData(this.receivers, synnteticAnsersByTime, this.realPoints);
    },

    reload() {
      this.start();
    }
  }
}
</script>

<style scoped>

canvas {
  background: pink;
}

.canvas-wrapper {
  width: 90%;
  height: calc(100vh - 200px);
  margin: auto;
  border: 2px solid orange;
  background: #f3f3f3;
  position: absolute;
  left: 5%;
  overflow: hidden;
}


</style>
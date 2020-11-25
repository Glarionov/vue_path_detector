<template>
  <div>
<!--    <div class="message-div" v-if="message">-->
<!--      Message: {{message}}-->
<!--    </div>-->
<!--    <div class="canvas-wrapper" ref = "mainCanvas">-->
<!--      <v-stage   :config="configKonva">-->

<!--        <v-layer>-->
<!--          <v-circle v-for="(circleData,pointIndex) in circlesToShow" :key="pointIndex" :config="circleData">-->
<!--          </v-circle>-->
<!--          <v-text v-for="(textData,pointIndex) in textsToShow" :key="pointIndex" :config="textData">-->
<!--          </v-text>-->
<!--        </v-layer>-->
<!--        <v-layer>-->

<!--          <v-line v-if:="linesToShow" v-for="(lineData, index) in linesToShow"-->
<!--                  :key="index"-->
<!--                  :config="lineData"-->
<!--          />-->
<!--        </v-layer>-->
<!--      </v-stage>-->
<!--    </div>-->


    <Display
        ref="mainCanvasComponent"
        :circlesToShow="circlesToShow"
        :linesToShow="linesToShow"
        :textsToShow="textsToShow"
        :message="message"
        :receivers="receivers"
    />

  </div>
</template>

<script>

import Display from "@/components/Display";
// import CoordinateCounter from "@/assets/js/CoordinateCounter";
var distance = require('euclidean-distance')
var average = require('average');

var solveQuadraticEquation = require('solve-quadratic-equation');
var centroid = require('triangle-centroid')

export default {
  components: {
    Display
    // Test
  },
name: "Dist",
  data: function () {
    return {
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
      startX: -1000 + Math.random() * 2000,
      startY: -1000 + Math.random() * 2000,
      horizontalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),
      verticalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),

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
          x: -333+ Math.random() * 400,
          y: -333+ Math.random() * 300,
          radius: 40,
          fill: "red",
          stroke: "black",
          strokeWidth: 20
        },
        2: {
          x: 1211+ Math.random() * 500,
          y: -1000 + Math.random() * 500,
          radius: 40,
          fill: "green",
          stroke: "black",
          strokeWidth: 20
        },
        3: {
          x:  -333+ Math.random() * 400,
          y: 1000 + Math.random() * 2000,
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
        width:  100,
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

    this.pathLinePoints = [this.startX, this.startY];

    // const {mainCanvas2} = this.$refs;
    // let mainCanvasInfo = this.$refs.mainCanvas.getBoundingClientRect();
    // this.mainLeftOffset = mainCanvasInfo.x;
    // this.mainTopOffset = mainCanvasInfo.y;
    //
    // this.configKonva.width = mainCanvasInfo.width;
    // this.configKonva.height = mainCanvasInfo.height;
    //
    // this.boxWidth = mainCanvasInfo.width;
    // this.boxHeight = mainCanvasInfo.height;

    // this.rightTestPoint = this.receivers[1].x;
    // this.leftestPoint = this.receivers[1].x;
    // this.highestPoint = this.receivers[1].y;
    // this.lowestPoint = this.receivers[1].y;
    //
    // for (let id = 1; id < 4; id++) {
    //   this.$refs.mainCanvasComponent.addCircleToDraw(this.receivers[id].x, this.receivers[id].y, this.receivers[id].radius, this.receivers[id].strokeWidth,
    //       'receiver_' + id,
    //       {fill: this.receivers[id].fill, stroke: this.receivers[id].stroke},
    //       'R.  ' + id
    //   );
    // }


    this.$refs.mainCanvasComponent.setRightestPoint(this.receivers[1].x);
    this.$refs.mainCanvasComponent.setLeftestPoint(this.receivers[1].x);
    this.$refs.mainCanvasComponent.setHighestPoint(this.receivers[1].y);
    this.$refs.mainCanvasComponent.setLowestPoint(this.receivers[1].y);

    this.countT1();




  },

  created () {

  },

  methods: {
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
      let a = (h*h + v*v - ss*ss);
      let b = (2 * x0 * h - 2 * h * receiverX + 2 * y0 * v - 2 * v * receiverY + 2 * totalTime * ss*ss);
      let c = -1 * (totalTime*totalTime * ss*ss - x0*x0 - receiverX*receiverX + 2 * x0 * receiverX - y0*y0 - receiverY*receiverY + 2 * y0 * receiverY);

      let roots = solveQuadraticEquation(a, b, c);

      let answers = [];

      /*
        Заведомо иключаются ситуации, кога приёмник двигался отрицательное время, или время большее, чем totalTime
       */
      for (let transmitterTravelTime of roots) {
        if (transmitterTravelTime < totalTime && totalTime - transmitterTravelTime > 0) {
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

    countT1() {

      let ansersByTime = {};


      let turnPointMinus = 0;

      this.realPoints[0] = {
        x: this.startX,
        y: this.startY,
      };

      this.$refs.mainCanvasComponent.addCircleToDraw(this.startX, this.startY, 20, 2,
          'real_point_0',
          {fill: 'red', strokeWidth: 2, stroke: 'black', opacity: 0.5}, ''+0);

      let ansersByTimeAndTurnPoint = {};

      let turnMoments = [8, 16, 24, 32];
      // let turnMoments = [];
      for (let turnPointKey = 0; turnPointKey <= turnMoments.length; turnPointKey++) {
        ansersByTimeAndTurnPoint[turnPointKey] = {};
        for (let passedSeconds = 1; passedSeconds < 40; passedSeconds ++) {


          let timeToCalc = passedSeconds - turnPointMinus;


          if (!turnMoments.hasOwnProperty(turnPointKey) || passedSeconds < turnMoments[turnPointKey]) {

            if (!this.realPoints.hasOwnProperty(passedSeconds)) {
              let realPointX = this.startX + timeToCalc * this.horizontalSpeed;
              let realPointY = this.startY + timeToCalc * this.verticalSpeed;


              this.realPoints[passedSeconds] = {
                x: realPointX,
                y: realPointY,
              };

              let opacity = 0.5;

              this.$refs.mainCanvasComponent.addCircleToDraw(realPointX, realPointY, 20, 2,
                  'real_point_' + passedSeconds,
                  {fill: 'red', strokeWidth: 2, stroke: 'black', opacity}, '' + passedSeconds);
            }


          }


          // if (passedSeconds != 6) {
          //   continue;
          // }


          // let answers = this.countT2ByRes()
          ansersByTime[passedSeconds] =
              {
                1:
                    this.countSignalTimeForCertainSecond(this.receivers[1].x, this.receivers[1].y, timeToCalc),
                2:
                    this.countSignalTimeForCertainSecond(this.receivers[2].x, this.receivers[2].y, timeToCalc),
                3:
                    this.countSignalTimeForCertainSecond(this.receivers[3].x, this.receivers[3].y, timeToCalc),
              };

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
          if ((!turnMoments.hasOwnProperty(turnPointKey) || passedSeconds <= turnMoments[turnPointKey]) && !synnteticAnsersByTime.hasOwnProperty(passedSeconds)) {
            synnteticAnsersByTime[passedSeconds] = answersByThisTurnPoint[passedSeconds];
          }
        }
      }


      // CoordinateCounter.setReceivers();
      // ansersByTime = ansersByTimeAndTurnPoint[0];

      ansersByTime = synnteticAnsersByTime;

      let errors = [];

      // let signalInfoNearCertainSecond = CoordinateCounter.groupSignalInfoByNearestSeconds(ansersByTime);

      /*s*/console.log('ansersByTime=', ansersByTime); //todo r

      this.$refs.mainCanvasComponent.setReceivers(this.receivers);
      let signalInfoNearCertainSecond = this.$refs.mainCanvasComponent.groupSignalInfoByNearestSeconds(ansersByTime);

      let shapeData = this.$refs.mainCanvasComponent.countLineByGroupedSignals(signalInfoNearCertainSecond);
      this.$refs.mainCanvasComponent.countParamsAndDraw();
      // let shapeData = CoordinateCounter.countLineByGroupedSignals(signalInfoNearCertainSecond);

      /*s*/console.log('shapeData=', shapeData); //todo r
      //
      // if (errors.length) {
      //   this.message = 'Average Error: ' + average(errors);
      // } else {
      //   this.message = 'No errors have been found';
      // }

      // this.$refs.mainCanvasComponent.groupSignalInfoByNearestSeconds(ansersByTime);


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
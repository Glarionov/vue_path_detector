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
    />

  </div>
</template>

<script>

import Display from "@/components/Display";

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
    //   this.addCircleToDraw(this.receivers[id].x, this.receivers[id].y, this.receivers[id].radius, this.receivers[id].strokeWidth,
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

    this.countParamsAndDraw();


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



    findThreeCircleIntersectionPoint(x0, y0, radius0, x1, y1, radius1, x2, y2, radius2) {


      let a, horizontalDistance01, verticalDistance01, distance01, h, rx, ry;
      let point2_x, point2_y;

      horizontalDistance01 = x1 - x0;
      verticalDistance01 = y1 - y0;

      distance01 = Math.sqrt((verticalDistance01*verticalDistance01) + (horizontalDistance01*horizontalDistance01));


      // this.addCircleToDraw(x0, y0, radius0, 4,
      //     'r1ude_r2121edf_wave_' + x0 + '_' + y0 + '_' + radius0,
      //     { strokeWidth: 6, stroke: 'red', opacity: 0.2}, '', false);
      //
      // this.addCircleToDraw(x1, y1, radius1, 4,
      //     'r1ude_2121redf_wave_' + x1 + '_' + y1 + '_' + radius1,
      //     { strokeWidth: 6, stroke: 'green', opacity: 0.2}, '', false);
      //
      // this.addCircleToDraw(x2, y2, radius2, 4,
      //     'r1ude_dfsdfsred_fwave_' + x2 + '_' + y2 + '_' + radius2,
      //     { strokeWidth: 6, stroke: 'blue', opacity: 0.2}, '', false);

      /**
       * Если расстояние между центрами кругов преывшает сумму их радиусов -
       * предполагаем, что это либо ошибка восприятия приёмников, либо же искажение,
       * вызанное движением передатчика и неодновременностью фактического приёма сигнала.
       * Равномерно увеличиваем радиусы так, чтобы их сумма была равна расстоянию между центрами
       */
      if (distance01 > (radius0 + radius1))
      {
        let radiusIncrease = (distance01 - radius0 - radius1)/2;
        radius0 += radiusIncrease;
        radius1 += radiusIncrease;
      }

      // this.addCircleToDraw(x0, y0, radius0, 4,
      //     'r1ude_redf_wave_' + x0 + '_' + y0 + '_' + radius0,
      //     { strokeWidth: 100, stroke: 'red', opacity: 0.2}, '', false);
      //
      // this.addCircleToDraw(x1, y1, radius1, 4,
      //     'r1ude_redf_wave_' + x1 + '_' + y1 + '_' + radius1,
      //     { strokeWidth: 100, stroke: 'green', opacity: 0.2}, '', false);
      //
      // this.addCircleToDraw(x2, y2, radius2, 4,
      //     'r1ude_red_fwave_' + x2 + '_' + y2 + '_' + radius2,
      //     { strokeWidth: 100, stroke: 'blue', opacity: 0.2}, '', false);

      /**
       * Аналогичные искажения могут привести к тому, что один круг будет находиться якобы внутри другого
       * Здесь также соответственно меняем длины кругов
       *
       */
      if (distance01 < Math.abs(radius0 - radius1))
      {
        let rpHalf = (Math.abs(radius0 - radius1) - distance01) / 2;

        if (radius0 > radius1) {
          radius0 -= rpHalf;
          radius1 += rpHalf;
        } else {
          radius1 -= rpHalf;
          radius0 += rpHalf;
        }
      }

      a = ((radius0*radius0) - (radius1*radius1) + (distance01*distance01)) / (2.0 * distance01) ;

      point2_x = x0 + (horizontalDistance01 * a/distance01);
      point2_y = y0 + (verticalDistance01 * a/distance01);




      let radiusMinusDistance = (radius0*radius0) - (a*a);

      if (radiusMinusDistance < 0) {
        return {error: true};
      }

      h = Math.sqrt(radiusMinusDistance);

      if (distance01 < 0.0001) {
        return {error: true};
      }

      rx = -verticalDistance01 * (h/distance01);
      ry = horizontalDistance01 * (h/distance01);

      let intersectionPoint1_x = point2_x + rx;
      let intersectionPoint2_x = point2_x - rx;
      let intersectionPoint1_y = point2_y + ry;
      let intersectionPoint2_y = point2_y - ry;

      horizontalDistance01 = intersectionPoint1_x - x2;
      verticalDistance01 = intersectionPoint1_y - y2;
      let d1 = Math.sqrt((verticalDistance01*verticalDistance01) + (horizontalDistance01*horizontalDistance01));

      horizontalDistance01 = intersectionPoint2_x - x2;
      verticalDistance01 = intersectionPoint2_y - y2;
      let d2 = Math.sqrt((verticalDistance01*verticalDistance01) + (horizontalDistance01*horizontalDistance01));

      let guessedX, guessedY;

      if(Math.abs(d1 - radius2) < Math.abs(d2 - radius2)) {
        guessedX = intersectionPoint1_x;
        guessedY = intersectionPoint1_y;

      }
      else  {
        guessedX = intersectionPoint2_x;
        guessedY = intersectionPoint2_y;
      }


      this.addCircleToDraw(x0, y0, radius0, 4,
          'red_wave_' + x0 + '_' + y0 + '_' + radius0,
          { strokeWidth: 1, stroke: 'red', opacity: 0.5}, '', false);

      this.addCircleToDraw(x1, y1, radius1, 4,
          'green_wave_' + x1 + '_' + y1 + '_' + radius1,
          { strokeWidth: 1, stroke: 'green', opacity: 0.5}, '', false);

      this.addCircleToDraw(x2, y2, radius2, 4,
          'blue_wave_' + x2 + '_' + y2 + '_' + radius2,
          { strokeWidth: 1, stroke: 'blue', opacity: 0.5}, '', false);


      return {x: guessedX, y: guessedY};

    },

    changeTransmitterDirection() {
      let turnMoment = turnMoments[turnPointKey];
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

      this.addCircleToDraw(this.startX, this.startY, 20, 2,
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

              this.addCircleToDraw(realPointX, realPointY, 20, 2,
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


        /*
          Код ниже отвечает за поворот передатчика, точнее говоря - за случайное изменение скорости передатчика
          по горизонтальнйо и вертикальной осям
        */
        let turnMoment = turnMoments[turnPointKey];
        let newHorizontalSpeed = -40 + Math.random() * 80;
        this.startX = this.startX + turnMoment * this.horizontalSpeed - turnMoment * newHorizontalSpeed;
        this.horizontalSpeed = newHorizontalSpeed;

        let newVerticalSpeed = -30 + Math.random() * 60;
        this.startY = this.startY + turnMoment * this.verticalSpeed - turnMoment * newVerticalSpeed;
        this.verticalSpeed = newVerticalSpeed;
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

      /*s*/console.log('synnteticAnsersByTime=', synnteticAnsersByTime); //todo r

      // ansersByTime = ansersByTimeAndTurnPoint[0];

      ansersByTime = synnteticAnsersByTime;

      /*s*/console.log('ansersByTimeAndTurnPoint=', ansersByTimeAndTurnPoint); //todo r





      let errors = [];




      let signalInfoNearCertainSecond = this.groupSignalInfoByNearestSeconds(ansersByTime);

      for (let passedSecond in signalInfoNearCertainSecond) {

        let knownTime = signalInfoNearCertainSecond[passedSecond];

        let extrapolationFail = false;

        let usableSignalInfo = JSON.parse(JSON.stringify(knownTime));

        /*
          Если для получилось так, что какой-то секунде не досталось своей информации о сигнале,
          из-за того, что она "разбежалась" по соседним секундам в процессе округления -
          записываем в массив этой секунды усреднённую информацию соседних секунд
        */
        for (let i =1 ; i <=3 ; i++) {
            if (!usableSignalInfo.hasOwnProperty(i)) {
              let tmo = passedSecond - 1;
              let tpo = parseInt(passedSecond) + 1;
                if (!signalInfoNearCertainSecond.hasOwnProperty(tmo)
                    || !signalInfoNearCertainSecond[tmo].hasOwnProperty(i)
                    || !signalInfoNearCertainSecond.hasOwnProperty(tpo) ||
                    !signalInfoNearCertainSecond[tpo].hasOwnProperty(i)
                ) {
                  extrapolationFail = true;
                  break;
                }

                let prevSignal = signalInfoNearCertainSecond[tmo][i];
                let nextSignal = signalInfoNearCertainSecond[tpo][i];

              usableSignalInfo[i] = {
                  signal: (prevSignal.signal + nextSignal.signal) / 2,
                  time: (prevSignal.time + nextSignal.time) / 2,
              };
            }
        }

        if (extrapolationFail) {
          continue;
        }


        let x0 = this.receivers[1].x;
        let y0 = this.receivers[1].y;
        let x1 = this.receivers[2].x;
        let y1 = this.receivers[2].y;
        let x2 = this.receivers[3].x;
        let y2 = this.receivers[3].y;


        for (let i =1 ; i <=3 ; i++) {
            let time = usableSignalInfo[i]['time'];
            let signal = usableSignalInfo[i]['signal'];

            if (time !== passedSecond) {
              if (time > parseInt(passedSecond)) {
                let tmo = parseInt(passedSecond) - 1;
                if (signalInfoNearCertainSecond.hasOwnProperty(tmo) && signalInfoNearCertainSecond[tmo].hasOwnProperty(i)) {
                  let knownTime2 = signalInfoNearCertainSecond[tmo][i];
                  let time2 = knownTime2['time'];
                  let signal2 = knownTime2['signal'];
                  let tdiff = time - time2;
                  let sdiff = signal - signal2;
                  let overTime = time - Math.trunc(time);
                  let minusValue = overTime * sdiff / (tdiff);

                  usableSignalInfo[i]['signal'] -= minusValue;

                } else {
                  let tmo = parseInt(passedSecond) + 1;
                  if (passedSecond == 0 ) {
                    /*s*/console.log('tmo=', tmo); //todo r
                  }
                  if (signalInfoNearCertainSecond.hasOwnProperty(tmo) && signalInfoNearCertainSecond[tmo].hasOwnProperty(i)) {
                    let knownTime2 = signalInfoNearCertainSecond[tmo][i];
                    /*s*/console.log('knownTime2=', knownTime2); //todo r
                    let time2 = knownTime2['time'];
                    let signal2 = knownTime2['signal'];
                    let tdiff = time2 - time;
                    /*s*/console.log('tdiff=', tdiff); //todo r
                    let sdiff = signal2 - signal;
                    /*s*/console.log('sdiff=', sdiff); //todo r
                    let overTime = time - Math.trunc(time);
                    /*s*/console.log('overTime=', overTime); //todo r
                    let minusValue = overTime * sdiff / (tdiff);
                    /*s*/console.log('minusValue=', minusValue); //todo r

                    usableSignalInfo[i]['signal'] -= minusValue;
                  } else {
                    extrapolationFail = true;
                  }

                }
              } else {
                let tmo = parseInt(passedSecond) + 1;
                if (signalInfoNearCertainSecond.hasOwnProperty(tmo) && signalInfoNearCertainSecond[tmo].hasOwnProperty(i)) {
                  let knownTime2 = signalInfoNearCertainSecond[tmo][i];
                  let time2 = knownTime2['time'];
                  let signal2 = knownTime2['signal'];
                  let tdiff = time2 - time;
                  let sdiff = signal2 - signal;
                  let overTime = passedSecond - time ;
                  let minusValue = overTime * sdiff / (tdiff);
                  usableSignalInfo[i]['signal'] += minusValue;
                }else {
                  let tmo = parseInt(passedSecond) - 1;
                  if (signalInfoNearCertainSecond.hasOwnProperty(tmo) && signalInfoNearCertainSecond[tmo].hasOwnProperty(i)) {
                    let knownTime2 = signalInfoNearCertainSecond[tmo][i];
                    let time2 = knownTime2['time'];
                    let signal2 = knownTime2['signal'];
                    let tdiff = time - time2;
                    let sdiff = signal - signal2;
                    let overTime = passedSecond - time;
                    let minusValue = overTime * sdiff / (tdiff);

                    usableSignalInfo[i]['signal'] += minusValue;
                  } else {
                    extrapolationFail = true;
                  }
                }
              }
            }
        }

        if (extrapolationFail) {
          continue;
        }

        let intersectionPoint = this.findThreeCircleIntersectionPoint(
            x0, y0, usableSignalInfo[1]['signal'] * this.signalSpeed,
            x1, y1, usableSignalInfo[2]['signal'] * this.signalSpeed,
            x2, y2, usableSignalInfo[3]['signal'] * this.signalSpeed
        );

        if (intersectionPoint.hasOwnProperty('error')) {
          continue;
        }

        if (this.realPoints.hasOwnProperty(passedSecond)) {
          let error = distance([intersectionPoint.x, intersectionPoint.y], [this.realPoints[passedSecond].x, this.realPoints[passedSecond].y]);
          errors.push(error);
        }

        this.addCircleToDraw( intersectionPoint.x, intersectionPoint.y, 50, 2,
            'intersection_' + passedSecond,
            {fill: 'green', stroke: 'black', opacity: 0.2}, passedSecond );

        this.pathLinePoints.push(intersectionPoint.x);
        this.pathLinePoints.push(intersectionPoint.y);


        if (!this.linesToShowAfterDrawStarts.hasOwnProperty('result')) {
          this.addLineToDraw(intersectionPoint.x, intersectionPoint.y, 10, 'result', {stroke: 'purple'});
        }

        if (passedSecond < 2222) {
          this.addLinePartToDraw(
              intersectionPoint.x,
              intersectionPoint.y,
              'result',
          );
        }
      }

      if (errors.length) {
        this.message = 'Average Error: ' + average(errors);
      } else {
        this.message = 'No errors have been found';
      }


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
<template>
  <div>
    error={{averageError}}
    {{ result }}
  <Test />
    <div class="canvas-wrapper" ref = "mainCanvas">
      <v-stage   :config="configKonva">

        <!--      <v-layer>-->
        <!--        <v-circle v-for="(circle, index) in realPoints" :key="index" :config="circle">-->
        <!--        </v-circle>-->
        <!--      </v-layer>-->
        <v-layer>
          <v-circle v-for="(receiver,pointIndex) in circlesToShow" :key="pointIndex" :config="receiver">
          </v-circle>
          <v-text v-for="(receiver,pointIndex) in textsToShow" :key="pointIndex" :config="receiver">
          </v-text>
        </v-layer>

        <!--      <v-layer>-->
        <!--        <v-circle v-for="(receiver,pointIndex) in foundPoints" :key="pointIndex" :config="receiver">-->
        <!--        </v-circle>-->
        <!--      </v-layer>-->

        <v-layer>
          <v-circle v-for="(receiver,pointIndex) in rads" :key="pointIndex" :config="receiver">
          </v-circle>
        </v-layer>

        <v-layer>
          <v-line :config="{
        x: 0,
        y: 0,
        points: this.pathLinePoints,
        tension: 0.5,
        strokeWidth: 30,
        opacity: 0.5,
        // closed: true,
        stroke: 'yellow',
        // fillLinearGradientStartPoint: { x: -50, y: -50 },
        // fillLinearGradientEndPoint: { x: 50, y: 50 },
        // fillLinearGradientColorStops: [0, 'red', 1, 'yellow']
      }"/>

<!--          <v-line v-if:="linesToShow" v-for="(lineData, index) in linesToShow"-->
<!--            :config="{-->
<!--              tension: 0.5,-->
<!--              opacity: 0.5,-->
<!--              stroke: 'yellow',-->
<!--              strokeWidth: lineData.strokeWidth,-->
<!--              points: lineData.points,-->
<!--            }"-->
<!--          />-->
        </v-layer>
      </v-stage>
    </div>


  </div>
</template>

<script>
import HelloWorld from "@/components/HelloWorld";

var distance = require('euclidean-distance')
var average = require('average');

var solveQuadraticEquation = require('solve-quadratic-equation');
var centroid = require('triangle-centroid')

import Test from '@/components/Test.vue'

export default {
  components: {
    Test
  },
name: "Dist",
  data: function () {
    return {
      mainCanvas: "abc",
      leftestPoint: 0,
      rightTestPoint: window.innerWidth,
      highestPoint: 0,
      lowestPoint: window.innerHeight,
      averageError: 0,
      startX: -2000 + Math.random() * 4000,
      startY: -2000 + Math.random() * 4000,
      horizontalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),
      verticalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),
      // startX: 1000,
      // startY: 600,
      // horizontalSpeed: 60,
      // verticalSpeed: -30,

      // turnTime: Math.floor(4 + Math.random()*5) * Math.floor(Math.random() + 0.5),
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
          // x: 111+ Math.random() * 200,
          // y: 111+ Math.random() * 200,
          x: 0,
          y: 0,
          radius: 40,
          fill: "red",
          stroke: "black",
          strokeWidth: 20
        },
        2: {
          // x: 1211+ Math.random() * 200,
          // y: 555+ Math.random() * 200,
          x: 1000,
          y: 0,
          radius: 40,
          fill: "green",
          stroke: "black",
          strokeWidth: 20
        },
        3: {
          // x: 777+ Math.random() * 200,
          // y: 1100+ Math.random() * 200,
          x: 0,
          y: 1000,
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
        fill: "red",
        background: "red",
        backgroundColor: "pink"
      },
      configCircle: {
        x: 0,
        y: 0,
        radius: 70,
        fill: "red",
        stroke: "yellow",
        strokeWidth: 4
      },
      result: '',
      signalSpeed: 1000,
      pathLinePoints: [],
      mainTopOffset: 0,
      mainLeftOffset: 0,
    }
  },
  mounted() {

    this.pathLinePoints = [this.startX, this.startY];


    // let mainCanvas = document.querySelector('.canvas-wrapper');
    // this.mainLeftOffset = mainCanvas.scrollLeft;
    // this.mainTopOffset = mainCanvas.scrollTop;

    const {mainCanvas2} = this.$refs;


    let mainCanvasInfo = this.$refs.mainCanvas.getBoundingClientRect();
    this.mainLeftOffset = mainCanvasInfo.x;
    this.mainTopOffset = mainCanvasInfo.y;

    this.configKonva.width = mainCanvasInfo.width;
    this.configKonva.height = mainCanvasInfo.height;

    this.rightTestPoint = this.receivers[1].x;
    this.leftestPoint = this.receivers[1].x;
    this.highestPoint = this.receivers[1].y;
    this.lowestPoint = this.receivers[1].y;

    for (let id = 1; id < 4; id++) {
      this.addCircleToDraw(this.receivers[id].x, this.receivers[id].y, this.receivers[id].radius, this.receivers[id].strokeWidth,
          'receiver_' + id,
          {fill: this.receivers[id].fill, stroke: this.receivers[id].stroke},
          'R.  ' + id
      );
    }

    this.countT1();

    this.countParamsAndDraw();


  },

  created () {

  },

  methods: {

    countParamsAndDraw() {




      let coordinatesFont = 20;

      let leftestPoint = this.leftestPoint;


      let distanceBetweenLeftestAndRightestPoint = this.rightTestPoint - this.leftestPoint;
      let distanceBetweenTopAndBottomPoint = this.lowestPoint - this.highestPoint;

      let paddingHor = distanceBetweenLeftestAndRightestPoint * 0.1;
      let paddingVer = distanceBetweenTopAndBottomPoint * 0.1;

      let padding = Math.max(paddingHor, paddingVer);

      distanceBetweenLeftestAndRightestPoint += padding;
      distanceBetweenTopAndBottomPoint += padding;

      // distanceBetweenLeftestAndRightestPoint *= 1.05;
      // distanceBetweenTopAndBottomPoint *= 1.05;

      let boxWidth = window.innerWidth - this.mainLeftOffset;
      let boxHeight = window.innerHeight - this.mainTopOffset;



      let screenToFieldWidth = boxWidth / distanceBetweenLeftestAndRightestPoint;
      let screenToFieldHeight = boxHeight / distanceBetweenTopAndBottomPoint;


      let scale = Math.min(screenToFieldWidth, screenToFieldHeight);


      let averageX = (this.rightTestPoint - this.leftestPoint) / 2;
      let halfWidth = (boxWidth - this.mainLeftOffset) / 2;


      let horShift = halfWidth - averageX;
      horShift = this.leftestPoint * -1 + padding / 4;

      let averageY = (this.lowestPoint - this.highestPoint) / 2;
      let halfHeight = (boxHeight) / 2;

      let verShift = halfHeight - averageY;
      verShift = this.highestPoint * -1 + padding / 4;


      if (!verShift) {
        verShift = distanceBetweenTopAndBottomPoint * 0.1;
      }

      let logToHorDistance = Math.log10(distanceBetweenLeftestAndRightestPoint);
      let flooredLogDistance = Math.floor(logToHorDistance);

      let logToUse = flooredLogDistance;

      if (distanceBetweenLeftestAndRightestPoint.toString()[1] < 3 && logToUse > 2) {
        logToUse--;
      }


      let loggedTen = Math.pow(10, logToUse);

      let pointNum = 1;


      let wholePart = (leftestPoint % loggedTen);


      let firstPoint = leftestPoint - wholePart;





      let pointX = firstPoint

      let realX = (pointX + horShift) * scale;



      while (realX < boxWidth
      ) {
        realX = (pointX + horShift) * scale;

        this.textsToShow['coordinate_x_' + pointX] = {
          x: realX,
          y: 10,
          text: pointX,
          fontSize: coordinatesFont
        };

        pointX += loggedTen
      }



      // Math.log10()
      // this.textsToShow['helping_text_leftest_point'] = {
      //   x: 10,
      //   y: 10,
      //   text: this.leftestPoint,
      //   fontSize: coordinatesFont
      // };
      //
      // this.textsToShow['helping_text_leftest_point2'] = {
      //   x: 100,
      //   y: 10,
      //   text: this.leftestPoint + 100,
      //   fontSize: coordinatesFont
      // };


      for (let circleIndex in this.circlesToShowAfterDrawStarts) {
        console.log("\n\n");
        let circleInfo = this.circlesToShowAfterDrawStarts[circleIndex];
        let xToDraw = (circleInfo.x + horShift) * scale;
        // let xToDraw = (circleInfo.x ) * scale;
        let yToDraw = (circleInfo.y + verShift ) * scale;
        // let yToDraw = (circleInfo.y  ) * scale;
        let radiusToDraw = (circleInfo.radius ) * scale;



        let strokeWidth = circleInfo.strokeWidth * scale;


        if (strokeWidth < 2) {
          strokeWidth = 2;
        }

        let index = circleIndex + '_abcdef';

        this.circlesToShow[index + '__circle'] = {
            x: xToDraw,
            y: yToDraw,
            radius: radiusToDraw ,
          strokeWidth,
          // stroke: "purple",
            ...circleInfo.otherProps,
            // fill: circleInfo.fill
        };

        let fontSize = 20;

        if (circleInfo.text) {
          this.textsToShow[index + '__text_from_circle'] = {
            x: xToDraw - fontSize * circleInfo.text.length / 4,
            y: yToDraw - fontSize / 2,
            text: circleInfo.text,
            fontSize: fontSize
          };
        }

        // this.textsToShow[index + '__text'] = {
        //   x: xToDraw,
        //   y: yToDraw,
        //   text: 'abc',
        //   fontSize: 30
        // };


        // this.circlesToShow[ 'abc' + circleIndex] = {
        //   x: (circleInfo.x ) ,
        //   y: (circleInfo.y ) ,
        //   radius: circleInfo.radius * scale,
        //   strokeWidth: 30,
        //   stroke: "black",
        //
        //   ...circleInfo.otherProps,
        //   opacity: 0.5,
        //   // fill: circleInfo.fill
        // };

      }

      // for (let circleIndex in this.circlesToShowAfterDrawStarts) {
      //   let circleInfo = this.circlesToShowAfterDrawStarts[circleIndex];
      //   this.circlesToShow[ 'abc' + circleIndex] = {
      //     x: (circleInfo.x ) ,
      //     y: (circleInfo.y ) ,
      //     radius: circleInfo.r * scale * 2,
      //     strokeWidth: 10,
      //     stroke: "black",
      //     opacity: 0.5,
      //     ...circleInfo
      //     // fill: circleInfo.fill
      //   };
      // }





    },
    addPoint(x, y, size = 0) {
      if (x + size > this.rightTestPoint) {
        this.rightTestPoint = x + size;
      }
      if (x - size < this.leftestPoint) {
        this.leftestPoint = x - size;
      }
      if (y + size > this.lowestPoint) {
        this.lowestPoint = y + size;
      }
      if (y - size < this.highestPoint) {
        this.highestPoint = y - size;
      }
    },
    addCircleToDraw(x, y, radius, strokeWidth, key, otherProps = {}, text = '', fieldChange = true) {
      if (fieldChange) {
        this.addPoint(x, y, radius + strokeWidth);
      }

      otherProps[text] = text;
      this.circlesToShowAfterDrawStarts[key] = {x, y, strokeWidth, radius, otherProps, text};
    },
    addLinePartToDraw(x, y, strokeWidth, key, otherProps = {}) {
      this.addPoint(x, y, strokeWidth);
      if (!this.linesToShowAfterDrawStarts.hasOwnProperty(key)) {
        this.linesToShowAfterDrawStarts[key] = [];
      }
      this.linesToShowAfterDrawStarts[key].push({x, y, otherProps});
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
      let a = (h*h + v*v - ss*ss);
      let b = (2 * x0 * h - 2 * h * receiverX + 2 * y0 * v - 2 * v * receiverY + 2 * totalTime * ss*ss);
      let c = -1 * (totalTime*totalTime * ss*ss - x0*x0 - receiverX*receiverX + 2 * x0 * receiverX - y0*y0 - receiverY*receiverY + 2 * y0 * receiverY);

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
    findThreeCircleIntersectionPoint(x0, y0, radius0, x1, y1, radius1, x2, y2, radius2) {
      let a, horizontalDistance01, verticalDistance01, distance01, h, rx, ry;
      let point2_x, point2_y;

      horizontalDistance01 = x1 - x0;
      verticalDistance01 = y1 - y0;

      distance01 = Math.sqrt((verticalDistance01*verticalDistance01) + (horizontalDistance01*horizontalDistance01));

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

      /**
       * Аналогичные искажения могут привести к тому, что один круг будет находиться якобы внутри другого
       * Здесь также соответственно меняем длины кругов
       *
       */
      if (distance01 < Math.abs(radius0 - radius1))
      {
        let rpHalf = (radius0 - radius1 - distance01) / 2;
        radius0 -= rpHalf;
        radius1 += rpHalf;
      }

      a = ((radius0*radius0) - (radius1*radius1) + (distance01*distance01)) / (2.0 * distance01) ;

      point2_x = x0 + (horizontalDistance01 * a/distance01);
      point2_y = y0 + (verticalDistance01 * a/distance01);

      h = Math.sqrt((radius0*radius0) - (a*a));

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
          'red_wave_' + x1 + '_' + y1 + '_' + radius1,
          { strokeWidth: 1, stroke: 'green', opacity: 0.5}, '', false);

      this.addCircleToDraw(x2, y2, radius2, 4,
          'red_wave_' + x2 + '_' + y2 + '_' + radius2,
          { strokeWidth: 1, stroke: 'blue', opacity: 0.5}, '', false);

      return {x: guessedX, y: guessedY};

    },
    countT1() {

      let ansersByTime = {};


      for (let passedSeconds = 1; passedSeconds < 20; passedSeconds ++) {




        // let answers = this.countT2ByRes()
        ansersByTime[passedSeconds] =
            {
              1:
              this.countSignalTimeForCertainSecond(this.receivers[1].x, this.receivers[1].y, passedSeconds),
              2:
              this.countSignalTimeForCertainSecond(this.receivers[2].x, this.receivers[2].y, passedSeconds),
              3:
              this.countSignalTimeForCertainSecond(this.receivers[3].x, this.receivers[3].y, passedSeconds),
            };



        this.realPoints[passedSeconds] = {
          x: this.startX + passedSeconds * this.horizontalSpeed,
          y: this.startY + passedSeconds * this.verticalSpeed,
        };

        let realPointX = this.startX + passedSeconds * this.horizontalSpeed;
        let realPointY = this.startY + passedSeconds * this.verticalSpeed;


        let opacity = 0.5;

        if (passedSeconds == 6) {
          opacity = 1;
        }

        this.addCircleToDraw(realPointX, realPointY, 20, 2,
            'real_point_' + passedSeconds,
            {fill: 'red', strokeWidth: 2, stroke: 'black', opacity});

        if (this.turnTime && passedSeconds === this.turnTime) {
          this.horizontalSpeed *= -1;
          this.startX = this.startX  - 2 * this.horizontalSpeed * passedSeconds;
        }
      }

      let signalInfoNearCertainSecond = {};

      let amountOfReceivers = 3;

      let errors = [];

      /*
         Информация о сигналах группируется в массивы,
         где ключи - это целые секунды, наиболее близкие к
         вычисленному времени отправки сигнала
      */
      for (let passedSeconds in ansersByTime) {
        let poss = ansersByTime[passedSeconds];
        for (let ri = 1; ri <= amountOfReceivers; ri++) {
            let rdatas = poss[ri];
            for (let rdata of rdatas) {
              if (typeof rdata !== 'undefined') {

                let tist =  passedSeconds - rdata;

                let ftist = Math.round(tist );

                if (!signalInfoNearCertainSecond.hasOwnProperty(ftist)) {
                  signalInfoNearCertainSecond[ftist] = {};
                }

                if (!signalInfoNearCertainSecond[ftist].hasOwnProperty(ri)) {
                  signalInfoNearCertainSecond[ftist][ri] = {'signal':rdata, 'time': tist};
                }
            }
            }
        }
      }

      /*s*/console.log('signalInfoNearCertainSecond=', signalInfoNearCertainSecond); //todo r
      /*s*/console.log('signalInfoNearCertainSecond[6]=', signalInfoNearCertainSecond[6]); //todo r

      for (let passedSecond in signalInfoNearCertainSecond) {



        let knownTime = signalInfoNearCertainSecond[passedSecond];


        let extrapolationFail = false;

        /*
          Если для из-за округления получилось так, что какой-то секунде не досталось своей информации о сигнале,
          из-за того, что она "разбежалась" по соседним приёмникам в процессе округления -
          записываем в массив этой секунды усреднённую информацию соседних секунд
        */
        for (let i =1 ; i <=3 ; i++) {
            if (!knownTime.hasOwnProperty(i)) {
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

              knownTime[i] = {
                  signal: (prevSignal.signal + nextSignal.signal) / 2,
                  time: (prevSignal.time + nextSignal.time) / 2,
              };
            }
        }

        if (extrapolationFail) {
          continue;
        }

        if (
            !knownTime.hasOwnProperty(1)
        ||
            !knownTime.hasOwnProperty(2)
            ||
            !knownTime.hasOwnProperty(3)
        ) {
          console.log('continued ' + passedSecond)
          continue;
        }

        // if (tt != 5) {
        //   continue;
        // }


        let x0 = this.receivers[1].x;
        let y0 = this.receivers[1].y;
        let x1 = this.receivers[2].x;
        let y1 = this.receivers[2].y;
        let x2 = this.receivers[3].x;
        let y2 = this.receivers[3].y;


        for (let i =1 ; i <=3 ; i++) {
            let time = knownTime[i]['time'];
            let signal = knownTime[i]['signal'];
            // knownTime[i] = knownTime[i]['signal'];


            if (time != passedSecond) {
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

                  knownTime[i]['signal'] -= minusValue;

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
                  knownTime[i]['signal'] += minusValue;

                }
              }
            }


            let raduis = knownTime[i]['signal'] * this.signalSpeed;
            let x = this.receivers[i].x;
            let y = this.receivers[i].y;

            let xa = x  ;
            let ya = y;
            let opacity = 0.1 + 0.05 * passedSecond;

            let redComponent = i == 1? 255: 0;
            let greenComponent = i == 2? 255: 0;
            let blueComponent = i == 3? 255: 0;

            this.rads[passedSecond + '_' + i] = {
              x: xa,
              y: ya,
              radius: raduis,
              // fill: "blue",
              stroke: `rgba(${redComponent},${greenComponent},${blueComponent},0.2)`,
              strokeWidth: 5,
            }
        }




        let intersectionPoint = this.findThreeCircleIntersectionPoint(
            x0, y0, knownTime[1]['signal'] * this.signalSpeed,
            x1, y1, knownTime[2]['signal'] * this.signalSpeed,
            x2, y2, knownTime[3]['signal'] * this.signalSpeed
        );

        if (this.realPoints.hasOwnProperty(passedSecond)) {
          errors.push(distance([intersectionPoint.x, intersectionPoint.y], [this.realPoints[passedSecond].x, this.realPoints[passedSecond].y]));
        }

        this.addCircleToDraw( intersectionPoint.x, intersectionPoint.y, 50, 2,
            'intersection_' + passedSecond,
            {fill: 'green', stroke: 'black', opacity: 0.2} );

        // this.foundPoints[tt] = {
        //   x: intersectionPoint.x,
        //   y: intersectionPoint.y,
        //   radius: 30,
        //   fill: "blue",
        //   stroke: "black",
        //   strokeWidth: 2,
        //   opacity: 0.2
        // };

        this.pathLinePoints.push(intersectionPoint.x);
        this.pathLinePoints.push(intersectionPoint.y);

        this.addLinePartToDraw(
            intersectionPoint.x,
            intersectionPoint.y,
            20,
            'found_path_line',
            {stroke: 'orange'}
        );

        /*
                this.addCircleToDraw(realPointX, realPointY, 40, 2,
            'real_point_' + passedSeconds,
            {fill: 'red', strokeWidth: 2, stroke: 'black', opacity: 0.5});
         */
      }

      this.averageError = average(errors);

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
  height: 90%;
  margin: auto;
  border: 2px solid orange;
  background: #f3f3f3;
  position: absolute;
  left: 5%;
}



</style>
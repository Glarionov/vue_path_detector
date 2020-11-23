<template>
  <div>
    error={{totalError}}
    {{ result }}

    <v-stage :config="configKonva">

      <v-layer>
        <v-circle v-for="(circle, index) in realPoints" :key="index" :config="circle">
        </v-circle>
      </v-layer>


      <v-layer>
        <v-circle v-for="(realPoint,pointIndex) in realPoints" :key="pointIndex" :config="realPoint">
        </v-circle>
      </v-layer>
      <v-layer>
        <v-circle v-for="(receiver,pointIndex) in receivers" :key="pointIndex" :config="receiver">
        </v-circle>
      </v-layer>

      <v-layer>
        <v-circle v-for="(receiver,pointIndex) in foundPoints" :key="pointIndex" :config="receiver">
        </v-circle>
      </v-layer>

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
      </v-layer>
    </v-stage>

  </div>
</template>

<script>
var distance = require('euclidean-distance')
var average = require('average');

var solveQuadraticEquation = require('solve-quadratic-equation');
var centroid = require('triangle-centroid')

export default {
name: "Dist",
  data: function () {
    return {
      averageError: 0,
      startX: 400 + Math.random() * 400,
      startY: 400 + Math.random() * 400,
      horizontalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),
      verticalSpeed: (30 + 30 * Math.random()) * (Math.round(Math.random()) * 2 - 1),
      turnTime: Math.floor(4 + Math.random()*5) * Math.floor(Math.random() + 0.5),
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
      receivers: {
        1: {
          x: 111+ Math.random() * 200,
          y: 111+ Math.random() * 200,
          radius: 20,
          fill: "red",
          stroke: "black",
          strokeWidth: 14
        },
        2: {
          x: 1211+ Math.random() * 200,
          y: 555+ Math.random() * 200,
          radius: 20,
          fill: "green",
          stroke: "black",
          strokeWidth: 14
        },
        3: {
          x: 777+ Math.random() * 200,
          y: 1100+ Math.random() * 200,
          radius: 20,
          fill: "blue",
          stroke: "black",
          strokeWidth: 14
        },
      },
      foundPoints: {},
      rads: {},
      car: {
        x: 0, y: 0, hs: 1000, vs: 0
      },
      configKonva: {
        width: 4000,
        height: 4000,
        fill: "red",
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
      pathLinePoints: []
    }
  },
  mounted() {
  },

  created () {
    this.pathLinePoints = [this.startX, this.startY];
    this.countT1();
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
          radius: 10,
          fill: "red",
          stroke: "black",
          strokeWidth: 2,
          opacity: 0.3
        };

        if (this.turnTime && passedSeconds === this.turnTime) {
          this.horizontalSpeed *= -1;
          this.startX = this.startX  - 2 * this.horizontalSpeed * passedSeconds;
        }
      }

      let knownTimes = {};

      let aor = 3;

      let errors = [];

      for (let tt in ansersByTime) {

        let poss = ansersByTime[tt];


        for (let ri = 1; ri <= aor; ri++) {
            let rdatas = poss[ri];
            for (let rdata of rdatas) {
              if (typeof rdata !== 'undefined') {

                let tist =  tt - rdata;

                let ftist = Math.round(tist );

                if (!knownTimes.hasOwnProperty(ftist)) {
                  knownTimes[ftist] = {};
                }

                if (!knownTimes[ftist].hasOwnProperty(ri)) {
                  knownTimes[ftist][ri] = {'signal':rdata, 'time': tist};
                }
            }
            }
        }
      }


      for (let tt in knownTimes) {
        let knownTime = knownTimes[tt];

        if (
            !knownTime.hasOwnProperty(1)
        ||
            !knownTime.hasOwnProperty(2)
            ||
            !knownTime.hasOwnProperty(3)
        ) {
          continue;
        }


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


            if (time != tt) {
              if (time > parseInt(tt)) {
                let tmo = parseInt(tt) - 1;
                if (knownTimes.hasOwnProperty(tmo) && knownTimes[tmo].hasOwnProperty(i)) {
                  let knownTime2 = knownTimes[tmo][i];
                  let time2 = knownTime2['time'];
                  let signal2 = knownTime2['signal'];
                  let tdiff = time - time2;
                  let sdiff = signal - signal2;
                  let overTime = time - Math.trunc(time);
                  let minusValue = overTime * sdiff / (tdiff);

                  knownTime[i]['signal'] -= minusValue;

                } else {
                  if (i == 1) {
                  }
                }
              } else {
                let tmo = parseInt(tt) + 1;
                if (knownTimes.hasOwnProperty(tmo) && knownTimes[tmo].hasOwnProperty(i)) {
                  let knownTime2 = knownTimes[tmo][i];
                  let time2 = knownTime2['time'];
                  let signal2 = knownTime2['signal'];
                  let tdiff = time2 - time;
                  let sdiff = signal2 - signal;
                  let overTime = tt - time ;
                  let minusValue = overTime * sdiff / (tdiff);


                  if (i == 1) {
                  } else {

                  }
                  knownTime[i]['signal'] += minusValue;

                } else {
                  if (i == 1) {
                  }
                }
              }
            }


            let raduis = knownTime[i]['signal'] * this.signalSpeed;
            let x = this.receivers[i].x;
            let y = this.receivers[i].y;

            let xa = x  ;
            let ya = y;
            let opacity = 0.1 + 0.05 * tt;

            let redComponent = i == 1? 255: 0;
            let greenComponent = i == 2? 255: 0;
            let blueComponent = i == 3? 255: 0;

            this.rads[tt + '_' + i] = {
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

        if (this.realPoints.hasOwnProperty(tt)) {
          errors.push(distance([intersectionPoint.x, intersectionPoint.y], [this.realPoints[tt].x, this.realPoints[tt].y]));
        }

        this.foundPoints[tt] = {
          x: intersectionPoint.x,
          y: intersectionPoint.y,
          radius: 30,
          fill: "blue",
          stroke: "black",
          strokeWidth: 2,
          opacity: 0.2
        };

        this.pathLinePoints.push(intersectionPoint.x);
        this.pathLinePoints.push(intersectionPoint.y);
      }

      this.totalError = average(errors);

    }
  }
}
</script>

<style scoped>

canvas {
  background: pink;
}
</style>
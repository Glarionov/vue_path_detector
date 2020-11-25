<template>
  <div>
    <div class="message-div" v-if="message">
      Message: {{message}}
    </div>
    <div class="canvas-wrapper" ref = "mainCanvas">
      <v-stage   :config="configKonva">

        <v-layer>
          <v-circle v-for="(circleData,pointIndex) in circlesToShow" :key="pointIndex" :config="circleData">
          </v-circle>
          <v-text v-for="(textData,pointIndex) in textsToShow" :key="pointIndex" :config="textData">
          </v-text>
        </v-layer>
        <v-layer>

          <v-line v-if:="linesToShow" v-for="(lineData, index) in linesToShow"
                  :key="index"
                  :config="lineData"
          />
        </v-layer>
      </v-stage>
    </div>


  </div>
</template>

<script>
export default {
  name: "Display",
  data: function () {
    return {
      circlesToShow: {},
      linesToShow: {},
      textsToShow: {},
      circlesToShowAfterDrawStarts: {},
      linesToShowAfterDrawStarts: {},
      pathLinePoints: {},
      rightTestPoint: 0,
      leftestPoint: 0,
      highestPoint: 0,
      lowestPoint: 0,
      signalSpeed: 1000,
      // receivers: {},
      configKonva: {
        width:  100,
        height: 100,
      },
    }
  },
  mounted() {
    const {mainCanvas2} = this.$refs;
    let mainCanvasInfo = this.$refs.mainCanvas.getBoundingClientRect();
    this.mainLeftOffset = mainCanvasInfo.x;
    this.mainTopOffset = mainCanvasInfo.y;

    this.configKonva.width = mainCanvasInfo.width;
    this.configKonva.height = mainCanvasInfo.height;

    this.boxWidth = mainCanvasInfo.width;
    this.boxHeight = mainCanvasInfo.height;

    // this.rightTestPoint = this.receivers[1].x;
    // this.leftestPoint = this.receivers[1].x;
    // this.highestPoint = this.receivers[1].y;
    // this.lowestPoint = this.receivers[1].y;

  },
  props: {
    // pos: Number,
    // hexid: Number,
    // eventData: Object,
    // hexParamsByPosition: Object,
    // circlesToShow: Object,
    // linesToShow: Object,
    // textsToShow: Object,
    message: String,
    receivers: Object,
    realPoints: Object
  },
  methods: {
    setRightestPoint(value) {
      this.rightTestPoint = value;
    },
    setLeftestPoint(value) {
      this.leftestPoint = value;
    },
    setHighestPoint(value) {
      this.highestPoint = value;
    },
    setLowestPoint(value) {
      this.lowestPoint = value;
    },
    setReceivers(receivers) {
      this.receivers = receivers;

      for (let id = 1; id < 4; id++) {
        this.addCircleToDraw(this.receivers[id].x, this.receivers[id].y, this.receivers[id].radius, this.receivers[id].strokeWidth,
            'receiver_' + id,
            {fill: this.receivers[id].fill, stroke: this.receivers[id].stroke},
            'R.  ' + id
        );
      }
    },


    /**
     * Создаёт массив из информации о сигналах,
     * сгруппированный по наиболее близкиким целым секундам к времени предполагаемой отправки сигнала
     *
     * @param answersByTime
     * @returns {{}}
     */
     groupSignalInfoByNearestSeconds(answersByTime) {
       /*s*/console.log('answersByTime=', answersByTime); //todo r

  let signalInfoNearCertainSecond = {};

  let amountOfReceivers = 3;

  for (let passedSeconds in answersByTime) {
    let poss = answersByTime[passedSeconds];
    /*s*/console.log('poss=', poss); //todo r
    for (let ri = 1; ri <= amountOfReceivers; ri++) {
      if (!poss.hasOwnProperty(ri) || !poss[ri]) {
        continue;
      }
      let rdatas = poss[ri];
      /*s*/console.log('rdatas=', rdatas); //todo r


      for (let rdata of rdatas) {
        if (!rdata) {
          continue;
        }
        if (typeof rdata !== 'undefined') {

          let timeWhenSignalWasSent = passedSeconds - rdata;

          let roundedTimeWhenSignalWasSent = Math.round(timeWhenSignalWasSent);

          if (!signalInfoNearCertainSecond.hasOwnProperty(roundedTimeWhenSignalWasSent)) {
            signalInfoNearCertainSecond[roundedTimeWhenSignalWasSent] = {};
          }

          if (!signalInfoNearCertainSecond[roundedTimeWhenSignalWasSent].hasOwnProperty(ri)) {
            signalInfoNearCertainSecond[roundedTimeWhenSignalWasSent][ri] = {
              'signal': rdata,
              'time': timeWhenSignalWasSent
            };
          }
        }
      }
    }
  }

  return signalInfoNearCertainSecond;
},

/**
 * Находит точку пересечения трёх окруженостей
 *
 * @param x0
 * @param y0
 * @param radius0
 * @param x1
 * @param y1
 * @param radius1
 * @param x2
 * @param y2
 * @param radius2
 * @returns {{error: boolean}|{x: number, y: number}}
 */
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

countLineByGroupedSignals(signalInfoNearCertainSecond) {

  let errors = [];

  for (let passedSecond in signalInfoNearCertainSecond) {

    let knownTime = signalInfoNearCertainSecond[passedSecond];

    let extrapolationFail = false;

    let usableSignalInfo = JSON.parse(JSON.stringify(knownTime));

    /*s*/console.log('usableSignalInfo=', usableSignalInfo); //todo r

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

    /*s*/console.log('intersectionPoint=', intersectionPoint); //todo r

    if (intersectionPoint.hasOwnProperty('error')) {
      continue;
    }

    if (this.realPoints && this.realPoints.hasOwnProperty(passedSecond)) {
      let error = distance([intersectionPoint.x, intersectionPoint.y], [this.realPoints[passedSecond].x, this.realPoints[passedSecond].y]);
      errors.push(error);
    }

    /*s*/console.log('intersectionPoint.x=', intersectionPoint.x); //todo r
    /*s*/console.log('intersectionPoint.y=', intersectionPoint.y); //todo r

    this.addCircleToDraw( intersectionPoint.x, intersectionPoint.y, 50, 2,
        'intersection_' + passedSecond,
        {fill: 'green', stroke: 'black', opacity: 0.2}, passedSecond );

    if (!this.linesToShowAfterDrawStarts.hasOwnProperty('result')) {
      this.addLineToDraw(intersectionPoint.x, intersectionPoint.y, 10, 'result', {stroke: 'purple'});
    }

    this.addLinePartToDraw(
        intersectionPoint.x,
        intersectionPoint.y,
        'result',
    );
  }

  return this.linesToShowAfterDrawStarts;
},

    /**
     * Отрисовывает координаты
     *
     * @param maxDistance
     * @param mostFarPoint
     * @param shift
     * @param boxSize
     * @param scale
     * @param coordinateToChange
     */
    writeCoordinates(maxDistance, mostFarPoint, shift, boxSize, scale, coordinateToChange = 'x') {
      let coordinatesFont = 20;
      let logToHorDistance = Math.log10(maxDistance);
      let logToUse = Math.floor(logToHorDistance);
      let loggedTen = Math.pow(10, logToUse);

      let remainder = (mostFarPoint % loggedTen);
      let pointCoordinate = mostFarPoint - remainder
      let physicalCoordinate = (pointCoordinate + shift) * scale;

      let x, y;

      while (physicalCoordinate < boxSize
          ) {
        physicalCoordinate = (pointCoordinate + shift) * scale;

        if (coordinateToChange === 'x') {
          x = physicalCoordinate;
          y = 10;
        } else {
          x = 10;
          y = physicalCoordinate;
        }

        this.textsToShow[coordinateToChange + 'coordinate_' + pointCoordinate] = {
          x,
          y,
          text: pointCoordinate,
          fontSize: coordinatesFont,
          opacity: 0.5
        };

        pointCoordinate += loggedTen
      }
    },
    /**
     * Отрисовка элементов с таким масштабом и сдвигом, чтобы всё поместилось в канвас
     */
    countParamsAndDraw() {
      let leftestPoint = this.leftestPoint;

      let lowestPoint = this.lowestPoint;

      let distanceBetweenLeftestAndRightestPoint = this.rightTestPoint - this.leftestPoint;
      let distanceBetweenTopAndBottomPoint = this.lowestPoint - this.highestPoint;

      let paddingHor = distanceBetweenLeftestAndRightestPoint * 0.1;
      let paddingVer = distanceBetweenTopAndBottomPoint * 0.1;

      let padding = Math.max(paddingHor, paddingVer);

      distanceBetweenLeftestAndRightestPoint += padding;
      distanceBetweenTopAndBottomPoint += padding;

      let boxWidth = this.boxWidth;
      let boxHeight = this.boxHeight;

      /*
        Элементы масштабируются так, чтобы компенсировать недостаточную ширину или высоту холста
       */
      let screenToFieldWidth = boxWidth / distanceBetweenLeftestAndRightestPoint;
      let screenToFieldHeight = boxHeight / distanceBetweenTopAndBottomPoint;
      let scale = Math.min(screenToFieldWidth, screenToFieldHeight);

      /*
        Элементы сдвигаются так, чтобы самый левый элемент на канвасе был чуть правее его левого края,
        а самый верхней - чуть ниже верхнего
       */
      let horShift = this.leftestPoint * -1 + paddingHor / 2;
      let verShift = this.highestPoint * -1 + paddingVer / 2;

      if (!verShift) {
        verShift = distanceBetweenTopAndBottomPoint * 0.1;
      }

      this.writeCoordinates(distanceBetweenLeftestAndRightestPoint, leftestPoint, horShift, boxWidth, scale, 'x');
      this.writeCoordinates(distanceBetweenTopAndBottomPoint, lowestPoint, verShift, boxHeight, scale, 'y');

      /*s*/console.log('this.circlesToShowAfterDrawStarts=', this.circlesToShowAfterDrawStarts); //todo r

      for (let circleIndex in this.circlesToShowAfterDrawStarts) {
        let circleInfo = this.circlesToShowAfterDrawStarts[circleIndex];
        let xToDraw = (circleInfo.x + horShift) * scale;
        let yToDraw = (circleInfo.y + verShift ) * scale;
        let radiusToDraw = (circleInfo.radius ) * scale;

        let strokeWidth = circleInfo.strokeWidth * scale;

        if (strokeWidth < 2) {
          strokeWidth = 2;
        }

        let index = circleIndex + '_circle_infom';

        this.circlesToShow[index + '_main'] = {
          x: xToDraw,
          y: yToDraw,
          radius: radiusToDraw ,
          strokeWidth,
          ...circleInfo.otherProps,
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
      }

      for (let index in this.linesToShowAfterDrawStarts) {
        let line = this.linesToShowAfterDrawStarts[index];

        let strokeWidth = line.strokeWidth * scale;

        if (strokeWidth < 2) {
          strokeWidth = 2;
        }
        let newPoints = [];

        for (let pointIndex in line.points) {
          let point = line.points[pointIndex];
          newPoints.push((point.x + horShift) * scale);
          newPoints.push((point.y + verShift) * scale);
        }
        this.linesToShow[index + '__line'] = {
          x: 0,
          y: 0,
          strokeWidth,
          points: newPoints,
          ...line.otherProps,
        };
      }

      this.$forceUpdate();

    },
    /**
     * Проверяет не выходит ли "точка" за пределы границ условного холста,
     * в случае необходимости расширяет его границы
     *
     * @param x
     * @param y
     * @param size
     */
    adjustMarginPointsByNewPoint(x, y, size = 0) {
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
        this.adjustMarginPointsByNewPoint(x, y, radius + strokeWidth);
      }

      otherProps[text] = text;
      this.circlesToShowAfterDrawStarts[key] = {x, y, strokeWidth, radius, otherProps, text};
    },
    addLineToDraw(x, y, strokeWidth, key, otherProps = {}) {
      this.adjustMarginPointsByNewPoint(x, y, strokeWidth);
      if (!this.linesToShowAfterDrawStarts.hasOwnProperty(key)) {
        this.linesToShowAfterDrawStarts[key] = {x: 0, y: 0,strokeWidth, otherProps, points: [{x, y}]};
      }

    },
    addLinePartToDraw(x, y, key, otherProps = {}) {
      if (!this.linesToShowAfterDrawStarts.hasOwnProperty(key)) {
        this.linesToShowAfterDrawStarts[key] = {x, y, otherProps, strokeWidth: 2, points: [{x, y}]};
      } else {
        this.linesToShowAfterDrawStarts[key].points.push({x, y});
      }
      this.adjustMarginPointsByNewPoint(x, y, this.linesToShowAfterDrawStarts[key].strokeWidth);
    },
  }
}
</script>

<style scoped>

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
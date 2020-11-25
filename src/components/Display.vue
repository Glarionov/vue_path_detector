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
      rightTestPoint: 0,
      leftestPoint: 0,
      highestPoint: 0,
      lowestPoint: 0,
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
    message: String
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
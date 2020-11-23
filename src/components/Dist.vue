<template>
  <div>
    {{ result }}

    <v-stage :config="configKonva">


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

    </v-stage>

  </div>
</template>

<script>
var solveQuadraticEquation = require('solve-quadratic-equation');


export default {
name: "Dist",
  data: function () {
    return {
      x0: 100,
      y0: 200,
      h: 60,
      v: 20,
      realPoints: {},
      receivers: {
        1: {
          x: 1888,
          y: 888,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
        },
        2: {
          x: 1400,
          y: 200,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
        },
        3: {
          x: 550,
          y: 1000,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
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
        x: 100,
        y: 100,
        radius: 70,
        fill: "red",
        stroke: "black",
        strokeWidth: 4
      },
      result: ''
    }
  },
  mounted() {
      for (let i = 0; i < 10; i++) {

        // (x - x1)^2 + (y - y1)^2 = a
        // (x - x2)^2 + (y - y2)^2 = b
        // (x - x3)^2 + (y - y3)^2 = c
        //
        // x^2 - 2*x*x1 + x1^1 - y ^ 2 - 2 * y * y1 + y1 ^ 2 = a
        //
        // -2 * x * x1 + x1 ^ 2 - 1 * y * y1 + y1 ^ 2 +
        // -2 * x * x2 + x2 ^ 2 - 1 * y * y1 + y2 ^ 2 +
        // -2 * x * x1 + x1 ^ 2 - 1 * y * y1 + y1 ^ 2 +
      }

      this.countT1();
  },

  methods: {
    countT2ByRes(px1, py1, tt) {

      let x0 = this.x0;
      let y0 = this.y0;
      let v = this.v;
      let h = this.h;
      let ss = 1000;

      let a = (h*h + v*v - ss*ss);

      let a2 = (2 * a);
      let mb = -1 * (2 * x0 * h - 2 * h * px1 + 2 * y0 * v - 2 * v * py1 + 2 * tt * ss*ss);
      let b = (2 * x0 * h - 2 * h * px1 + 2 * y0 * v - 2 * v * py1 + 2 * tt * ss*ss);
      let c = (x0*x0 + px1*px1 - 2 * x0 * px1 + y0*y0 + py1*py1 + 2 * y0 * py1 - tt*tt * ss*ss);

      c = -1 * (tt*tt * ss*ss - x0*x0 - px1*px1 + 2 * x0 * px1 - y0*y0 - py1*py1 + 2 * y0 * py1);

       // a = -990000;
      // b = 1980000;
      // c = -900000;

      var roots = solveQuadraticEquation(a, b, c);



      let D = b * b - 4 * a * c;
      let Dsqrt = Math.sqrt(
          D
      );




      let r1 = (mb - Dsqrt) / a2;
      let r2 = (mb + Dsqrt) / a2;

      let answers = [];
      // if (r1 > 0 && r1 < tt) {
      //   answers.push(Math.round((tt - (r1))*100)/100);
      // }
      // if (r2 > 0 && r2 < tt) {
      //   answers.push(Math.round((tt - (r2))*100)/100);
      // }

      for (let r of roots) {
        if (r > 0 && r < tt && tt - r > 0) {
          // answers.push(Math.round((tt - (r))*100)/100);
          // answers.push(Math.round((tt - (r))*100000)/100000);
          answers.push(tt - r );
        }
      }


      this.realPoints[tt] = {
        // x: x0 + tt * h,
        x: x0 + tt * h,
        // y: y0 + tt * v,
        y: y0 + tt * v,
        radius: 10,
        fill: "red",
        stroke: "black",
        strokeWidth: 2,
        opacity: 0.3
      };

      return answers;

    },

    countT1() {
      let x0 = 0;
      let y0 = 0;
      let v = 0;
      let py1 = 0;
      let tt = 2;
      let px1 = 40;
      let h = 10;
      let ss = 1000;

      let ansersByTime = {};

      let receivers = {
        1: {
          x: 1888,
          y: 888,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
        },
        2: {
          x: 1400,
          y: 200,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
        },
        3: {
          x: 550,
          y: 1000,
          radius: 10,
          fill: "blue",
          stroke: "black",
          strokeWidth: 4
        },
      };

      this.receivers  = receivers;

      for (tt = 1; tt < 20; tt ++) {


        // let answers = this.countT2ByRes()
        ansersByTime[tt] =
            {
              1:
              this.countT2ByRes(this.receivers[1].x, this.receivers[1].y, tt),
              2:
              this.countT2ByRes(this.receivers[2].x, this.receivers[2].y, tt),
              3:
              this.countT2ByRes(this.receivers[3].x, this.receivers[3].y, tt),
              // this.countT2ByRes(0, 0, tt)[0],
              // this.countT2ByRes(300, 300, tt)[0],
            };
      }


      let knownTimes = {};

      let aor = 3;

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
                  // knownTimes[ftist][ri] = tt - rdata;
                  knownTimes[ftist][ri] = {'signal':rdata, 'time': tist};
                }

                let floored = Math.floor(tist);

                if (!knownTimes.hasOwnProperty(floored)) {
                  knownTimes[floored] = {};
                }

                if (!knownTimes[floored].hasOwnProperty(ri)) {
                  // knownTimes[ftist][ri] = tt - rdata;
                  knownTimes[floored][ri] = {'signal':rdata, 'time': tist};
                }

                if (ri == 2) {

                }

            }



            }
        }
      }

      // (x - this.receivers[1].x)

      // (x - px1) ^ 2 + (y - py1) ^ 2 = r1
      // (x - px2) ^ 2 + (y - py2) ^ 2 = r2
      // (x - px3) ^ 2 + (y - py3) ^ 2 = r3
      //
      // x^2 - 2*x*px1 + px1 ^ 2 + y ^ 2 + 2 * py1 * y + py1 ^ 2 = r1
      // x^2 - 2*x*px2 + px2 ^ 2 + y ^ 2 + 2 * py2 * y + py2 ^ 2 = r2
      // x^2 - 2*x*px1 + px1 ^ 2 + y ^ 2 + 2 * py1 * y + py3 ^ 2 = r3

      // y ^ 2 + y * (2 * py1) + (x^2 - 2*x*px1 + px1 ^ 2 + py1 ^ 2 - r1) = 0
      // D = (2 * py1) ^ 2 - 4 * (x^2 - 2*x*px1 + px1 ^ 2 + py1 ^ 2 - r1);
      //
      // Dsqr = Math.sqrt(D);
      // r1 = (-1 * (2 * py1) - Dsqr) / 2;
      // r2 = (-1 * (2 * py1) + Dsqr) / 2;
      //
      // x ^ 2 + y ^ 2 = r1
      // y ^ 2 = r - x ^ 2
      // y = Math.sqrt(r - x ^ 2) //-+
      //



      let EPSILON = 800;

      let el = 100;

      //stop
      // return true;

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
          if ((tt - 1) % 1 ==0 ) {

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


                  if (i == 1) {
                  } else {

                  }
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
            } else {
              if (i == 1) {
              }
            }


            let raduis = knownTime[i]['signal'] * ss;
            let x = this.receivers[i].x;
            let y = this.receivers[i].y;

            let xa = x  ;
            let ya = y;
            let opacity = 0.1 + 0.05 * tt;
            this.rads[tt + '_' + i] = {
              x: xa,
              y: ya,
              radius: raduis,
              // fill: "blue",
              stroke: "black",
              strokeWidth: 2,
              opacity: opacity
            }
          }
        }
        let r0 = knownTime[1]['signal'] * ss;
        let r1 = knownTime[2]['signal'] * ss;
        let r2 = knownTime[3]['signal'] * ss;

        let a, dx, dy, d, h, rx, ry;
        let point2_x, point2_y;

        dx = x1 - x0;
        dy = y1 - y0;

        /* Determine the straight-line distance between the centers. */
        d = Math.sqrt((dy*dy) + (dx*dx));

        /* Check for solvability. */
        if (d > (r0 + r1))
        {
          //
          // console.log('no solution. circles do not intersect')

          let rp = (d - r0 - r1)/2;
          let oldr0 = r0;
          let oldr1 = r1;
          r0 += rp;
          r1 += rp;

          console.log("R0 have been increased from " + oldr0 + " to " + r0 +
              " and r1 from" + oldr1 + " to " + r1 +
              ". d= " + d )

          // continue;
          // return false;
        }
        if (d < Math.abs(r0 - r1))
        {
          // console.log('no solution. one circle is contained in the other')
          continue;
          // return false;
        }

        /* 'point 2' is the point where the line through the circle
        * intersection points crosses the line between the circle
        * centers.
        */

        /* Determine the distance from point 0 to point 2. */
        a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

        /* Determine the coordinates of point 2. */
        point2_x = x0 + (dx * a/d);
        point2_y = y0 + (dy * a/d);


        /* Determine the distance from point 2 to either of the
        * intersection points.
        */
        h = Math.sqrt((r0*r0) - (a*a));

        /* Now determine the offsets of the intersection points from
        * point 2.
        */


        rx = -dy * (h/d);
        ry = dx * (h/d);



        /* Determine the absolute intersection points. */
        let intersectionPoint1_x = point2_x + rx;
        let intersectionPoint2_x = point2_x - rx;
        let intersectionPoint1_y = point2_y + ry;
        let intersectionPoint2_y = point2_y - ry;

        // console.log("INTERSECTION Circle1 AND Circle2:", "(" + intersectionPoint1_x + "," + intersectionPoint1_y + ")" + " AND (" + intersectionPoint2_x + "," + intersectionPoint2_y + ")");

        /* Lets determine if circle 3 intersects at either of the above intersection points. */
        dx = intersectionPoint1_x - x2;
        dy = intersectionPoint1_y - y2;
        let d1 = Math.sqrt((dy*dy) + (dx*dx));

        dx = intersectionPoint2_x - x2;
        dy = intersectionPoint2_y - y2;
        let d2 = Math.sqrt((dy*dy) + (dx*dx));

        if(Math.abs(d1 - r2) < EPSILON) {
          // let opacity = 0.1 + tt/20;
          let opacity = 0.3 ;

          this.foundPoints[tt] = {
            x: intersectionPoint1_x,
            y: intersectionPoint1_y,
            radius: 30,
            fill: "green",
            stroke: "black",
            strokeWidth: 2,
            opacity: opacity
          };

          console.log("INTERSECTION Circle1 AND Circle2 AND Circle3:", "(" + intersectionPoint1_x + "," + intersectionPoint1_y + ")");
        }
        else if(Math.abs(d2 - r2) < EPSILON) {

          let opacity = 0.1 + tt/20; opacity = 0.3 ;

          this.foundPoints[tt] = {
            x: intersectionPoint1_x,
            y: intersectionPoint1_y,
            radius: 30,
            fill: "blue",
            stroke: "black",
            strokeWidth: 2,
            opacity: opacity
          };

          console.log("I!!!!!!!NTERSECTION Circle1 AND Circle2 AND Circle3:", "(" + intersectionPoint2_x + "," + intersectionPoint2_y + ")"); //here was an error
        }
        else {
          // console.log("INTERSECTION Circle1 AND Circle2 AND Circle3:", "NONE");
        }
      }




      // (
      //     (mb)
      //     - Dsqrt
      // )
      // /a;


    }
  }
}
</script>

<style scoped>

canvas {
  background: pink;
}
</style>
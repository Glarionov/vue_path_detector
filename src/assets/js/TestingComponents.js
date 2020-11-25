class TestingComponents {
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
            if (
                // transmitterTravelTime > 0 &&
                transmitterTravelTime < totalTime && totalTime - transmitterTravelTime > 0) {
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
    }
}

export default TestingComponents;
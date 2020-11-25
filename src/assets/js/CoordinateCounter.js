export default class CoordinateCounter {
    /**
     * Создаёт массив из информации о сигналах,
     * сгруппированный по наиболее близкиким целым секундам к времени предполагаемой отправки сигнала
     *
     * @param answersByTime
     * @returns {{}}
     */
    groupSignalInfoByNearestSeconds(answersByTime) {

        let signalInfoNearCertainSecond = {};

        let amountOfReceivers = 3;

        for (let passedSeconds in answersByTime) {
            let poss = answersByTime[passedSeconds];
            for (let ri = 1; ri <= amountOfReceivers; ri++) {
                let rdatas = poss[ri];
                for (let rdata of rdatas) {
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
    }
}
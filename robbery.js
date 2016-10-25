'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

var DAYWEEK = ['ПН', 'ВТ', 'СР'];
var DAY = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    return {
        countTime: 0,

        moments: findMoments(findBusyInterval(schedule, workingHours), duration),

        timeZone: parseInt(workingHours.from.split('+')[1]),

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.moments.length > 0;
        },


        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */

        format: function (template) {
            if (this.exists()) {
                var ind = this.countTime;
                var timeARobbery = new Date(this.moments[ind].from + this.timeZone * 60 * 60000);
                var day = DAYWEEK[timeARobbery.getUTCDay() - 1];

                return template.replace('%HH', pad(timeARobbery.getUTCHours()))
                    .replace('%MM', pad(timeARobbery.getUTCMinutes()))
                    .replace('%DD', day);

            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }
            var timeARobbery = (duration + 30) * 60 * 1000;
            var ind = this.countTime;
            if (this.moments[ind].to - this.moments[ind].from >= timeARobbery) {
                var newFrom = this.moments[ind].from + 30 * 60000;
                this.moments[ind] = { from: newFrom, to: this.moments[ind].to };

                return this.moments[ind];
            }

            while (this.countTime < this.moments.length - 1) {
                this.countTime++;
                var curr = this.moments[this.countTime].from;
                var prev = this.moments[this.countTime - 1].from;
                if (curr - prev >= 30 * 6000) {
                    return this.moments[this.countTime];
                }
            }

            return false;
        }
    };
};

function pad(num) {
    num = num < 10 ? '0' + num : num.toString();

    return num;
}

function findBusyTime(schedule, workingHours) {
    var busy = [];
    addBusy(busy, schedule.Linus);
    addBusy(busy, schedule.Rusty);
    addBusy(busy, schedule.Danny);
    addBusy(busy, busyBank(workingHours));

    return busy.sort(function (a, b) {
        if (a.from > b.from) {
            return 1;
        }
        if (a.from < b.from) {
            return -1;
        }

        return 0;
    });
}

function busyBank(workingHours) {
    var busy = [];
    var timeZone = workingHours.from.split('+')[1];
    busy.push({ from: '00:00+' + timeZone, to: workingHours.from });
    busy.push({ from: workingHours.to, to: '23:59:59+' + timeZone });

    return findBusyforDay(busy);
}

function findBusyforDay(busy) {
    var newBusy = [];
    DAYWEEK.forEach(function (itemDay) {
        busy.forEach(function (item) {
            newBusy.push({ from: itemDay + ' ' + item.from, to: itemDay + ' ' + item.to });
        });
    });

    return newBusy;
}

function addBusy(busy, timetable) {
    timetable.forEach(function (item) {
        busy.push({ from: parseDate(item.from), to: parseDate(item.to) });
    });
}

function parseDate(note) {
    note = note.split(' ');
    var day = DAY[note[0]];
    var time = note[1].split('+')[0];
    var timeZone = pad(note[1].split('+')[1]) + '00';


    return Date.parse('2 ' + day + ' 2016 ' + time + ' GMT+' + timeZone);
}


function disjointBusy(busy) {
    var disBusy = [busy[0]];
    var ind = 0;
    busy.forEach(function (item) {
        if (disBusy[ind].to <= item.to) {
            if (disBusy[ind].to >= item.from) {
                disBusy[ind] = { from: disBusy[ind].from, to: item.to };
            } else {
                disBusy.push(item);
                ind++;
            }
        }
    });

    return disBusy;
}

function findBusyInterval(schedule, workingHours) {
    var busy = findBusyTime(schedule, workingHours);
    if (busy.length !== 0) {
        return disjointBusy(busy);
    }

    return [];
}


function findMoments(busyInterval, duration) {
    var moments = [];
    for (var i = 0; i < busyInterval.length - 1; i++) {
        if (busyInterval[i + 1].from - busyInterval[i].to >= duration * 60000) {
            moments.push({ from: busyInterval[i].to, to: busyInterval[i + 1].from });
        }
    }

    return moments;
}

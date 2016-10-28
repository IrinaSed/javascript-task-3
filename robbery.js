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

var ROBBERY_TIME = ['ПН', 'ВТ', 'СР'];
var DAY_BY_IND = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
var MS_IN_HOUR = 60 * 60 * 1000;
var MS_IN_MINUTES = 60 * 1000;
var OFFSET_TIME = 30;
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    return {
        currentId: 0,

        moments: findMoments(findBusyIntervals(schedule, workingHours), duration),

        timeZone: parseInt(workingHours.from.split('+')[1], 10),

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
                var msRobberyTime = this.moments[this.currentId].from + this.timeZone * MS_IN_HOUR;
                var robberyTime = new Date(msRobberyTime);
                var dayRobbery = ROBBERY_TIME[robberyTime.getUTCDay() - 1];

                return template
                            .replace('%HH', normalizeTime(robberyTime.getUTCHours()))
                            .replace('%MM', normalizeTime(robberyTime.getUTCMinutes()))
                            .replace('%DD', dayRobbery);

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
            var robberyTime = (duration + OFFSET_TIME) * MS_IN_MINUTES;
            var currentId = this.currentId;
            if (this.moments[currentId].to - this.moments[currentId].from >= robberyTime) {
                var offsetFrom = this.moments[this.currentId].from + OFFSET_TIME * MS_IN_MINUTES;
                this.moments[currentId] = { from: offsetFrom, to: this.moments[currentId].to };

                return true;
            }
            while (this.currentId < this.moments.length - 1) {
                this.currentId++;
                var currentMoment = this.moments[this.currentId].from;
                var previousMoment = this.moments[this.currentId - 1].from;
                if (currentMoment - previousMoment >= OFFSET_TIME * MS_IN_MINUTES) {
                    return true;
                }
            }

            return false;
        }
    };
};

function normalizeTime(num) {
    return (num < 10 ? '0' : '') + num;
}

function findBusyTime(schedule, workingHours) {
    var intervalsBusy = [];
    Object.keys(schedule).forEach(function (name) {
        addBusyIntervals(intervalsBusy, schedule[name]);
    });
    addBusyIntervals(intervalsBusy, findBusyTimeForBank(workingHours));

    return intervalsBusy.sort(function (a, b) {
        return a.from - b.from;
    });
}

function findBusyTimeForBank(workingHours) {
    var intervalsBusyForBank = [];
    var timeZone = workingHours.from.split('+')[1];
    intervalsBusyForBank.push({ from: '00:00+' + timeZone, to: workingHours.from });
    intervalsBusyForBank.push({ from: workingHours.to, to: '23:59:59+' + timeZone });

    return findBusyforDay(intervalsBusyForBank);
}

function findBusyforDay(intervalsBusyForBank) {
    var intervalsBusy = [];
    ROBBERY_TIME.forEach(function (dayRobbery) {
        intervalsBusyForBank.forEach(function (timeBusy) {
            intervalsBusy.push({ from: dayRobbery + ' ' + timeBusy.from,
                to: dayRobbery + ' ' + timeBusy.to });
        });
    });

    return intervalsBusy;
}

function addBusyIntervals(intervalsBusy, timeTable) {
    timeTable.forEach(function (time) {
        intervalsBusy.push({ from: parseDate(time.from), to: parseDate(time.to) });
    });
}

function parseDate(dateString) {
    dateString = dateString.split(' ');
    var day = DAY_BY_IND[dateString[0]];
    var time = dateString[1].split('+')[0];
    var timeZone = normalizeTime(dateString[1].split('+')[1]) + '00';


    return Date.parse('2 ' + day + ' 2016 ' + time + ' GMT+' + timeZone);
}


function joinIntervals(intervals) {
    var gaps = [intervals[0]];
    var idGap = 0;
    intervals.forEach(function (interval) {
        if (gaps[idGap].to <= interval.to) {
            if (gaps[idGap].to >= interval.from) {
                gaps[idGap] = { from: gaps[idGap].from, to: interval.to };
            } else {
                gaps.push(interval);
                idGap++;
            }
        }
    });

    return gaps;
}

function findBusyIntervals(schedule, workingHours) {
    var intervalslsBusy = findBusyTime(schedule, workingHours);
    if (intervalslsBusy.length !== 0) {
        return joinIntervals(intervalslsBusy);
    }

    return [];
}


function findMoments(busyIntervals, duration) {
    var moments = [];
    for (var i = 0; i < busyIntervals.length - 1; i++) {
        if (busyIntervals[i + 1].from - busyIntervals[i].to >= duration * MS_IN_MINUTES) {
            moments.push({ from: busyIntervals[i].to, to: busyIntervals[i + 1].from });
        }
    }

    return moments;
}

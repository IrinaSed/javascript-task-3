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

var ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
var DAYS_OF_WEEK = { 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6, 'ВС': 7 };
var MS_IN_HOUR = 60 * 60 * 1000;
var MS_IN_MINUTES = 60 * 1000;
var OFFSET_TIME = 30;
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    return {
        idMoment: 0,

        moments: findMoments(findBusyTimes(schedule, workingHours), duration),

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
            if (!this.exists()) {
                return '';
            }
            var msRobberyTime = this.moments[this.idMoment].from + this.timeZone * MS_IN_HOUR;
            var robberyTime = new Date(msRobberyTime);
            var dayRobbery = ROBBERY_DAYS[robberyTime.getUTCDay() - 1];

            return template
                        .replace('%HH', normalizeTime(robberyTime.getUTCHours()))
                        .replace('%MM', normalizeTime(robberyTime.getUTCMinutes()))
                        .replace('%DD', dayRobbery);

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
            var idMoment = this.idMoment;
            if (this.moments[idMoment].to - this.moments[idMoment].from >= robberyTime) {
                var offsetMoment = this.moments[this.idMoment].from + OFFSET_TIME * MS_IN_MINUTES;
                this.moments[idMoment] = { from: offsetMoment, to: this.moments[idMoment].to };

                return true;
            }
            while (this.idMoment < this.moments.length - 1) {
                this.idMoment++;
                var currentMoment = this.moments[this.idMoment].from;
                var previousMoment = this.moments[this.idMoment - 1].from;
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

function findBusyIntervals(schedule, workingHours) {
    var busyIntervals = [];
    Object.keys(schedule).forEach(function (name) {
        addBusyIntervals(busyIntervals, schedule[name]);
    });
    addBusyIntervals(busyIntervals, findBusyTimeForBank(workingHours));

    return busyIntervals.sort(function (a, b) {
        return a.from - b.from;
    });
}

function findBusyTimeForBank(workingHours) {
    var busyIntervalsForBank = [];
    var timeZone = workingHours.from.split('+')[1];
    busyIntervalsForBank.push({ from: '00:00+' + timeZone, to: workingHours.from });
    busyIntervalsForBank.push({ from: workingHours.to, to: '23:59:59+' + timeZone });

    return findBusyforDay(busyIntervalsForBank);
}

function findBusyforDay(intervalsBusyForBank) {
    var intervalsBusy = [];
    ROBBERY_DAYS.forEach(function (robberyDay) {
        intervalsBusyForBank.forEach(function (timeBusy) {
            intervalsBusy.push({ from: robberyDay + ' ' + timeBusy.from,
                to: robberyDay + ' ' + timeBusy.to });
        });
    });

    return intervalsBusy;
}

function addBusyIntervals(busyIntervals, timeTable) {
    timeTable.forEach(function (time) {
        busyIntervals.push({ from: parseDate(time.from), to: parseDate(time.to) });
    });
}

function parseDate(dateString) {
    dateString = dateString.split(' ');
    var day = DAYS_OF_WEEK[dateString[0]];
    var time = dateString[1].split('+')[0];
    var timeZone = normalizeTime(dateString[1].split('+')[1]) + '00';

    return Date.parse('2 ' + day + ' 2016 ' + time + ' GMT+' + timeZone);
}


function joinIntervals(intervals) {
    var jointIntervals = [intervals[0]];
    var idInterval = 0;
    intervals.forEach(function (interval) {
        if (jointIntervals[idInterval].to <= interval.to) {
            if (jointIntervals[idInterval].to >= interval.from) {
                var jointInterval = { from: jointIntervals[idInterval].from, to: interval.to };
                jointIntervals[idInterval] = jointInterval;
            } else {
                jointIntervals.push(interval);
                idInterval++;
            }
        }
    });

    return jointIntervals;
}

function findBusyTimes(schedule, workingHours) {
    var busyTimes = findBusyIntervals(schedule, workingHours);
    if (busyTimes.length !== 0) {
        return joinIntervals(busyTimes);
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

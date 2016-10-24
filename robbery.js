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
var dayWeekOnNumber = ['ПН', 'ВТ', 'СР'];
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
   // console.info(schedule, duration, workingHours);
    var mon = [];
    var tue = [];
    var wed = [];
    var days = { 1: mon, 2: tue, 3: wed };

    return {
        countTime: 0,

        moments: findExistMoments(schedule, duration, workingHours, days).sort(),

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
                var day = dayWeekOnNumber[this.moments[ind].getDay() - 1];

                return template.replace('%HH', pad(this.moments[ind].getHours()))
                               .replace('%MM', pad(this.moments[ind].getMinutes()))
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
            var indDay = this.moments[this.countTime].getDay();
            var hour = this.moments[this.countTime].getHours();
            var minutes = this.moments[this.countTime].getMinutes() + duration + 30;
            if (findExistFlourHour(indDay, hour, minutes, this)) {
                var newTime = createDate(indDay, hour + ':' + (minutes - duration) + '+0', 0);
                this.countTime++;
                this.moments.splice(this.countTime, 0, newTime);

                return this.moments[this.countTime];
            }

            if (this.countTime < this.moments.length - 1) {
                this.countTime++;

                return this.moments[this.countTime];
            }

            return false;
        }
    };

    function findExistFlourHour(indDay, hour, minutes, obj) {
        var workTimeBank = createWorkTime(indDay, workingHours);
        var timeRobberyTo = createDate(indDay, hour + ':' + minutes + '+0', 0);
        var robberyInterval = { from: obj.moments[obj.countTime], to: timeRobberyTo };
        var existFloorHour = true;
        existFloorHour = existFloorHour && haveTimeInWorkTime(robberyInterval, workTimeBank);
        existFloorHour = existFloorHour && notIntersectWithOther(robberyInterval, -1, days[indDay]);

        return existFloorHour;
    }
};

function pad(num) {
    num = num < 10 ? '0' + num : num.toString();

    return num;
}

function findExistMoments(schedule, duration, workingHours, days) {
    var daysWeek = { ПН: 1, ВТ: 2, СР: 3 };
    var moments = [];
    var timeZoneBank = parseInt(workingHours.from.split('+')[1]);
    createBusyOnDays(schedule);
    moments = findTime(days, workingHours, duration);


    function createBusyOnDays() {
        schedule.Danny.forEach(parseNote);
        schedule.Rusty.forEach(parseNote);
        schedule.Linus.forEach(parseNote);
    }

    function parseNote(item) {
        var dateFrom = item.from.split(' ');
        var dateTo = item.to.split(' ');
        var dayFrom = daysWeek[dateFrom[0]];
        var dayTo = daysWeek[dateTo[0]];
        var dateTimeFrom = createDate(dayFrom, dateFrom[1], timeZoneBank);
        var dateTimeTo = createDate(dayTo, dateTo[1], timeZoneBank);
        // dayFrom и dayTo может измениться из-за перевода к одному часовому поясу
        dayFrom = dateTimeFrom.getUTCDay();
        dayTo = dateTimeTo.getUTCDay();
        if (dayFrom < dayTo) {
            divideTime(dayFrom, dayTo, dateTimeFrom, dateTimeTo);
        } else {
            addInterval(days[dayFrom], { from: dateTimeFrom, to: dateTimeTo });
        }
    }

    function divideTime(dayFrom, dayTo, dateTimeFrom, dateTimeTo) {
        while (dayFrom !== dayTo) {
            var endDay = createDate(dayFrom, '23:59+' + timeZoneBank, timeZoneBank);
            addInterval(days[dayFrom], { from: dateTimeFrom, to: endDay });
            dayFrom++;
            dateTimeFrom = createDate(dayFrom, '00:00+' + timeZoneBank, timeZoneBank);
        }
        if (dayTo < 4) {
            addInterval(days[dayFrom], { from: dateTimeFrom, to: dateTimeTo });
        }
    }

    return moments;
}

function belongDateIntervalWithEndSegment(interval, date) {
    return interval.from <= date && interval.to >= date;
}

function addInterval(day, newInterval) {
    if (day.length === 0) {
        day.push(newInterval);
    } else {
        day.forEach(function (item, ind) {
            if (belongDateIntervalWithEndSegment(item, newInterval.from)) {
                if (!belongDateIntervalWithEndSegment(item, newInterval.to)) {
                    day[ind] = { from: item.from, to: newInterval.to };
                }
            } else if (belongDateIntervalWithEndSegment(item, newInterval.to)) {
                if (!belongDateIntervalWithEndSegment(item, newInterval.from)) {
                    day[ind] = { from: newInterval.from, to: item.to };
                }
            } else if (belongDateIntervalWithEndSegment(newInterval, item.from)) {
                day[ind] = { from: newInterval.from, to: newInterval.to };
            } else {
                day.push({ from: newInterval.from, to: newInterval.to });
            }
        });
    }
}

// обработку даты на корректность не делаем из-за условии задачи
function createDate(day, noteTime, timeZoneBank) {
    var time = noteTime.split('+');
    var currentTimeZone = parseInt(time[1]);
    var hour = parseInt(time[0].split(':')[0]);
    var minute = parseInt(time[0].split(':')[1]);
    hour += timeZoneBank - currentTimeZone;

    return new Date(2016, 1, day, hour, minute);
}


function findTime(days, workingHours, timeForRobbery) {
    var moments = [];
    for (var i = 1; i < 4; i++) {
        var indexDay = i;
        var day = days[i];
        var workTimeBank = createWorkTime(indexDay, workingHours);
        if (day.length === 0) {
            moments.push(workTimeBank.from);
        } else {
            checkTime(day, workTimeBank, timeForRobbery, moments);
        }
    }

    return moments;
}

function checkTime(day, workTimeBank, timeForRobbery, moments) {
    var indexDay = day[0].from.getUTCDay();
    day.forEach(function (item, indItem) {
        var dateFrom = createDateWithOffset(item.from, indexDay, -timeForRobbery);
        var dateTo = createDateWithOffset(item.to, indexDay, timeForRobbery);
        var begInterval = { from: dateFrom, to: item.to };
        var endInterval = { from: item.from, to: dateTo };
        appropriateTime(begInterval, indItem, begInterval.from);
        appropriateTime(endInterval, indItem, item.to);
        checkTimeBegWorkBank();
    });

    function appropriateTime(interval, indItem, result) {
        if (haveTimeInWorkTime(interval, workTimeBank)) {
            if (notIntersectWithOther(interval, indItem, day)) {
                moments.push(result);
            }
        }
    }

    function checkTimeBegWorkBank() {
        if (moments.length !== 0) {
            var momentNotExist = true;
            moments.forEach(function (item) {
                momentNotExist = momentNotExist && item.valueOf() !== workTimeBank.from.valueOf();
            });
            if (momentNotExist) {
                var hour = workTimeBank.from.getHours();
                var minutes = workTimeBank.from.getMinutes() + timeForRobbery;
                var dateTo = createDate(indexDay, hour + ':' + minutes + '+0', 0);
                appropriateTime({ from: workTimeBank.from, to: dateTo }, -1, workTimeBank.from);
            }
        }
    }
}


function createWorkTime(day, workingHours) {
    var timeZoneBank = workingHours.from[workingHours.from.length - 1];
    var timeFrom = createDate(day, workingHours.from, timeZoneBank);
    var timeTo = createDate(day, workingHours.to, timeZoneBank);

    return { from: timeFrom, to: timeTo };
}

function createDateWithOffset(date, indexDay, timeForRobbery) {
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var note = hour + ':' + (minutes + timeForRobbery) + '+0';

    return createDate(indexDay, note, 0);
}

function haveTimeInWorkTime(interval, workTimeBank) {
    var result = belongDateIntervalWithEndSegment(workTimeBank, interval.from);
    result = result && belongDateIntervalWithEndSegment(workTimeBank, interval.to);

    return result;
}

function belongDateInterval(interval, date) {
    return interval.from < date && interval.to > date;
}

function notIntersectWithOther(currentInterval, indCurrent, day) {
    var result = true;
    day.forEach(function (item, ind) {
        if (indCurrent !== ind) {
            result = result && !belongDateInterval(currentInterval, item.to);
            result = result && !belongDateInterval(currentInterval, item.from);
            result = result && !belongDateInterval(item, currentInterval.from);
            result = result && !belongDateInterval(item, currentInterval.to);
        }
    });

    return result;
}

/*


*/

var moment = require('moment');
var Parser = require('../parser').Parser;
var ParsedResult = require('../../result').ParsedResult;
var util  = require('../../utils/EN');

var PATTERN = new RegExp('(\\W|^)' +
    '(?:les?|la|l\'|du|des?)\\s*' +
    '(\\d+)?\\s*' +
    '(prochaine?s?|derni[eè]re?s?|pass[ée]e?s?|pr[ée]c[ée]dents?|suivants?)?\\s*' +
    '(secondes?|min(?:ute)?s?|heures?|jours?|semaines?|mois|trimestres?|années?)\\s*' +
    '(prochaine?s?|derni[eè]re?s?|pass[ée]e?s?|pr[ée]c[ée]dents?|suivants?)?' +
    '(?=\\W|$)', 'i'
);

var MULTIPLIER_GROUP = 2;
var MODIFIER_1_GROUP = 3;
var RELATIVE_WORD_GROUP = 4;
var MODIFIER_2_GROUP = 5;

exports.Parser = function FRRelativeDateFormatParser(){
    Parser.apply(this, arguments);

    this.pattern = function() { return PATTERN; };

    this.extract = function(text, ref, match, opt){
        var index = match.index + match[1].length;
        var text  = match[0];
        text  = match[0].substr(match[1].length, match[0].length - match[1].length);

        var result = new ParsedResult({
            index: index,
            text: text,
            ref: ref
        });
        result.tags['FRRelativeDateFormatParser'] = true;

        // Multiplier
        var multiplier = match[MULTIPLIER_GROUP] === undefined ? 1 : match[MULTIPLIER_GROUP];

        // Modifier
        var modifier = match[MODIFIER_1_GROUP] === undefined ?
                    (match[MODIFIER_2_GROUP] === undefined ? '' : match[MODIFIER_2_GROUP].toLowerCase())
                     : match[MODIFIER_1_GROUP].toLowerCase();
        var modifierFactor;
        switch(true) {
            case /prochaine?s?/.test(modifier):
            case /suivants?/.test(modifier):
                modifierFactor = 1;
                break;
            case /derni[eè]re?s?/.test(modifier):
            case /pass[ée]e?s?/.test(modifier):
            case /pr[ée]c[ée]dents?/.test(modifier):
                modifierFactor = -1;
                break;
        }

        var total = multiplier * modifierFactor;

        var dateFrom = moment(ref),
            dateTo = moment(ref);
        var relative = match[RELATIVE_WORD_GROUP];
        var startOf;
        switch(true) {
            case /secondes?/.test(relative):
                dateFrom.add(total, 's');
                dateTo.add(modifierFactor, 's');
                startOf = 'second';
                break;
            case /min(?:ute)?s?/.test(relative):
                dateFrom.add(total, 'm');
                dateTo.add(modifierFactor, 'm');
                startOf = 'minute';
                break;
            case /heures?/.test(relative):
                dateFrom.add(total, 'h');
                dateTo.add(modifierFactor, 'h');
                startOf = 'hour';
                break;
            case /jours?/.test(relative):
                dateFrom.add(total, 'd');
                dateTo.add(modifierFactor, 'd');
                startOf = 'day';
                break;
            case /semaines?/.test(relative):
                dateFrom.add(total, 'w');
                dateTo.add(modifierFactor, 'w');
                startOf = 'week';
                break;
            case /mois?/.test(relative):
                dateFrom.add(total, 'M');
                dateTo.add(modifierFactor, 'M');
                startOf = 'month';
                break;
            case /trimestres?/.test(relative):
                dateFrom.add(total, 'Q');
                dateTo.add(modifierFactor, 'Q');
                startOf = 'quarter';
                break;
            case /années?/.test(relative):
                dateFrom.add(total, 'y');
                dateTo.add(modifierFactor, 'y');
                startOf = 'year';
                break;
        }

        // if we go forward, switch the start and end dates
        if(modifierFactor > 0) {
            var dateTmp = dateFrom;
            dateFrom = dateTo;
            dateTo = dateTmp;
        }

        // Get start and end of dates
        dateFrom.startOf(startOf);
        dateTo.endOf(startOf);

        // Assign results
        result.start.assign('year', dateFrom.year());
        result.start.assign('month', dateFrom.month() + 1);
        result.start.assign('day', dateFrom.date());
        result.start.assign('minute', dateFrom.minute());
        result.start.assign('second', dateFrom.second());
        result.start.assign('hour', dateFrom.hour());

        result.end = result.start.clone();
        result.end.assign('year', dateTo.year());
        result.end.assign('month', dateTo.month() + 1);
        result.end.assign('day', dateTo.date());
        result.end.assign('minute', dateTo.minute());
        result.end.assign('second', dateTo.second());
        result.end.assign('hour', dateTo.hour());
        return result;
    };
};

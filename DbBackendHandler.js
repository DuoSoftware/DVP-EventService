var dbModel = require('dvp-dbmodels');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;


var GetEventDataBySessionId = function(sessionId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.DVPEvent.findAll({where: [{SessionId: sessionId}], order: ['EventTime']})
            .then(function (evtList)
            {
                logger.debug('[DVP-EventService.GetEventDataBySessionId] PGSQL Get dvp event records for sessionId query success');

                callback(undefined, evtList);
            }).catch(function(err)
            {
                logger.error('[DVP-EventService.GetEventDataBySessionId] PGSQL Get dvp event records for sessionId query failed', err);
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};

var GetDevEventDataBySessionId = function(sessionId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.DVPEvent.findAll({where: [{SessionId: sessionId},{EventCategory: 'DEVELOPER'}], order: ['EventTime']})
            .this(function (evtList)
            {
                logger.debug('[DVP-EventService.GetDevEventDataBySessionId] PGSQL Get dvp event records for sessionId and cat query success');

                callback(undefined, evtList);
            }).catch(function(err)
            {
                logger.error('[DVP-EventService.GetDevEventDataBySessionId] PGSQL Get dvp event records for sessionId and cat query failed', err);
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};

var GetEventDataByClassTypeCat = function(evtClass, evtType, evtCategory, callback)
{
    var emptyList = [];
    try
    {
        dbModel.DVPEvent.findAll({where: [{EventClass: evtClass},{EventType: evtType},{EventCategory: evtCategory}], order: ['EventTime']})
            .then(function (evtList)
            {
                logger.debug('[DVP-EventService.GetEventDataByClassTypeCat] PGSQL Get dvp event records for ClassTypeCat query success');

                callback(undefined, evtList);
            }).catch(function(err)
            {
                logger.error('[DVP-EventService.GetEventDataByClassTypeCat] PGSQL Get dvp event records for ClassTypeCat query failed', err);
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};

var GetCallCDRForAppAndSessionId = function(appId, sessionId, callback)
{
    try
    {
        dbModel.CallCDR.find({where: [{Uuid: sessionId},{AppId: appId}]})
            .then(function (cdr)
            {
                logger.debug('[DVP-EventService.GetCallCDRForAppAndSessionId] PGSQL Get dvp event records query success');
                callback(undefined, cdr);

            }).catch(function(err)
            {
                logger.error('[DVP-EventService.GetCallCDRForAppAndSessionId] PGSQL Get dvp event records query failed', err);
                callback(err, undefined);
            });
    }
    catch(ex)
    {
        callback(ex, undefined);
    }
};

var AddEventData = function(eventInfo, callback)
{
    try
    {
        eventInfo
            .save()
            .then(function (rsp)
            {
                logger.debug('[DVP-EventService.AddEventData] PGSQL save dvp event record query success');
                callback(undefined, true);

            }).catch(function(err)
            {
                logger.error('[DVP-EventService.AddEventData] PGSQL save dvp event record query failed', err);
                callback(err, false);
            })
    }
    catch(ex)
    {
        callback(ex, false);
    }
};

module.exports.AddEventData = AddEventData;
module.exports.GetEventDataBySessionId = GetEventDataBySessionId;
module.exports.GetEventDataByClassTypeCat = GetEventDataByClassTypeCat;
module.exports.GetCallCDRForAppAndSessionId = GetCallCDRForAppAndSessionId;
module.exports.GetDevEventDataBySessionId = GetDevEventDataBySessionId;

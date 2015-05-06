var dbModel = require('DVP-DBModels');

var GetEventDataBySessionId = function(sessionId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.DVPEvent.findAll({where: [{SessionId: sessionId}], order: ['EventTime']})
            .complete(function (err, evtList)
            {
                callback(err, evtList);
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
            .complete(function (err, evtList)
            {
                callback(err, evtList);
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
            .complete(function (err, evtList)
            {
                callback(err, evtList);
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
            .complete(function (err, cdr)
            {
                callback(err, cdr);
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
            .complete(function (err) {
                try {
                    if (err)
                    {
                        callback(err, false);
                    }
                    else
                    {
                        callback(undefined, true);
                    }
                }
                catch (ex)
                {
                    callback(ex, false);
                }

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

"use strict";

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







var GetDevEventDataByAppIdAndDateRange = function(type, appId, starttime, endtime, nodes, companyId, tenantId, callback)
{



    var query = {};
    if(starttime &&  endtime){

        query.createdAt =  {
            $lte: new Date(endtime),
            $gte: new Date(starttime)
        }
    }


    if (appId)
    {
        query.EventData = appId
    }

    if(type){

        query.EventType = type;
    }

    if(companyId){

        query.CompanyId = companyId;
    }

    if(tenantId){

        query.TenantId = tenantId;
    }

    if(nodes && nodes.length > 0)
    {
        query.EventParams = {$in: nodes};
    }


    try {


        var emptyList = [];
        dbModel.DVPEvent.findAll({
                attributes: ['EventParams',
                    [dbModel.SequelizeConn.fn('count', dbModel.SequelizeConn.col('SessionId')), 'count']], where: query, group: ['CSDB_DVPEvent.EventParams']
            })
            .then(function (evtList) {
                logger.debug('[DVP-EventService.GetDevEventDataBySessionId] PGSQL Get dvp event records for appid and type success');
                callback(undefined, evtList);
            }).catch(function (err) {
            logger.error('[DVP-EventService.GetDevEventDataBySessionId] PGSQL Get dvp event records for appid and type query failed', err);
            callback(err, emptyList);
        });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};


var GetEventNodes = function(companyId, tenantId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.EventTypes.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]})
            .then(function (evtNodeList)
            {
                callback(null, evtNodeList);
            }).catch(function(err)
            {
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};

var SaveEventNode = function(eventNodeInfo, companyId, tenantId, callback)
{
    try
    {
        eventNodeInfo.CompanyId = companyId;
        eventNodeInfo.TenantId = tenantId;
        var evtObj = dbModel.EventTypes.build(eventNodeInfo);

        evtObj
            .save()
            .then(function (rsp)
            {
                callback(null, true);

            }).catch(function(err)
            {
                callback(err, false);
            })
    }
    catch(ex)
    {
        callback(ex, false);
    }
};

var GetAllEventsByNodes = function(startDate, endDate, type, appId, companyId, tenantId, nodes, limit, offset, callback)
{
    var emptyList = [];
    try
    {
        var query = {where: [{CompanyId: companyId},{TenantId: tenantId}, {EventType: type}, {EventData: appId}, {createdAt: {$lte: endDate, $gte: startDate}}], offset: offset, limit: limit};

        if(nodes && nodes.length > 0)
        {
            query.where.push({EventParams: {$in: nodes}});
        }
        dbModel.DVPEvent.findAll(query)
            .then(function (evtList)
            {
                callback(null, evtList);
            }).catch(function(err)
            {
                callback(err, emptyList);
            });
    }
    catch(ex)
    {
        callback(ex, emptyList);
    }
};

var GetAllEventsByNodesCount = function(startDate, endDate, type, appId, companyId, tenantId, nodes, callback)
{
    try
    {
        var query = {where: [{CompanyId: companyId},{TenantId: tenantId}, {EventType: type}, {EventData: appId}, {createdAt: {$lte: endDate, $gte: startDate}}]};

        if(nodes && nodes.length > 0)
        {
            query.where.push({EventParams: {$in: nodes}});
        }
        dbModel.DVPEvent.aggregate('*', 'count', query)
            .then(function (cnt)
            {
                callback(null, cnt);
            }).catch(function(err)
            {
                callback(err, 0);
            });
    }
    catch(ex)
    {
        callback(ex, 0);
    }
};



var GetDevEventDataBySessionId = function(sessionId, callback)
{
    var emptyList = [];
    try
    {
        dbModel.DVPEvent.findAll({where: [{SessionId: sessionId},{EventCategory: 'DEVELOPER'}], order: ['EventTime']})
            .then(function (evtList)
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
module.exports.GetEventNodes = GetEventNodes;
module.exports.SaveEventNode = SaveEventNode;
module.exports.GetAllEventsByNodes = GetAllEventsByNodes;
module.exports.GetEventDataBySessionId = GetEventDataBySessionId;
module.exports.GetEventDataByClassTypeCat = GetEventDataByClassTypeCat;
module.exports.GetCallCDRForAppAndSessionId = GetCallCDRForAppAndSessionId;
module.exports.GetDevEventDataBySessionId = GetDevEventDataBySessionId;
module.exports.GetDevEventDataByAppIdAndDateRange = GetDevEventDataByAppIdAndDateRange;
module.exports.GetAllEventsByNodesCount = GetAllEventsByNodesCount;
//Subscribe to event channel
var redisHandler = require('./RedisHandler.js');
var dbBackendHandler = require('./DbBackendHandler.js');
var dbModel = require('DVP-DBModels');
var restify = require('restify');
var config = require('config');
var stringify = require('stringify');
var nodeUuid = require('node-uuid');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

var server = restify.createServer({
    name: 'localhost',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/DVP/API/' + hostVersion + '/EventService/GetAllEventsBySessionId/:sessionId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var sessionId = req.params.sessionId;
        logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - HTTP Request Received - Params - sessionId : %s', reqId, sessionId);

        dbBackendHandler.GetEventDataBySessionId(sessionId, function(err, evtList)
        {
            if(err)
            {
                logger.error('[DVP-EventService.GetAllEventsBySessionId] - [%s] - dbBackendHandler.GetEventDataBySessionId threw an exception', reqId, err);
            }

            var jsonString = messageFormatter.FormatMessage(err, "", undefined, evtList);
            logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);
        })

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetAllEventsBySessionId] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "", undefined, emptyArr);
        logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/' + hostVersion + '/EventService/GetAllDevEventsBySessionId/:sessionId/:appId', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var sessionId = req.params.sessionId;
        var appId = req.params.appId;

        logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - HTTP Request Received - Params - sessionId : %s, appId : %s', reqId, sessionId, appId);

        dbBackendHandler.GetCallCDRForAppAndSessionId(appId, sessionId, function(err, cdr)
        {
            if(cdr)
            {
                dbBackendHandler.GetDevEventDataBySessionId(sessionId, function(err, evtList)
                {
                    if(err)
                    {
                        logger.error('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - dbBackendHandler.GetDevEventDataBySessionId threw an exception', reqId, err);
                    }

                    var jsonString = messageFormatter.FormatMessage(err, "", undefined, evtList);
                    logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                })
            }
            else
            {
                if(err)
                {
                    logger.error('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - dbBackendHandler.GetCallCDRForAppAndSessionId threw an exception', reqId, err);
                }
                var jsonString = messageFormatter.FormatMessage(err, "", undefined, emptyArr);
                logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }


        })

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "", undefined, emptyArr);
        logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/' + hostVersion + '/EventService/GetAllEventsByClassTypeCategory/:eventClass/:eventType/:eventCategory', function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var evtClass = req.params.eventClass;
        var evtType = req.params.eventType;
        var evtCategory = req.params.eventCategory;

        logger.debug('[DVP-EventService.GetAllEventsByClassTypeCategory] - [%s] - HTTP Request Received - Params - evtClass : %s, evtType : %s, evtCategory : %s', reqId, evtType, evtCategory);

        dbBackendHandler.GetEventDataByClassTypeCat(evtClass, evtType, evtCategory, function(err, evtList)
        {
            if(err)
            {
                logger.error('[DVP-EventService.GetAllEventsByClassTypeCategory] - [%s] - dbBackendHandler.GetEventDataByClassTypeCat threw an exception', reqId, err);
            }
            var jsonString = messageFormatter.FormatMessage(err, "", undefined, evtList);
            logger.debug('[DVP-EventService.GetAllEventsByClassTypeCategory] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);
        })

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetAllEventsByClassTypeCategory] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "", undefined, emptyArr);
        logger.debug('[DVP-EventService.GetAllEventsByClassTypeCategory] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});


redisHandler.RedisSubscribe('SYS:MONITORING:DVPEVENTS');

redisHandler.redisClient.on('message', function(channel, message)
{
    if(channel && channel === 'SYS:MONITORING:DVPEVENTS')
    {
        var reqId = nodeUuid.v1();

        logger.debug('[DVP-EventService.DVPEVENTS] - [%s] - Event Received - Params - message : %s, appId : %s', reqId, message);

        if(message)
        {
            var evtObj = JSON.parse(message);

            var evtClass = evtObj['EventClass'];
            var evtType = evtObj['EventType'];
            var evtCategory = evtObj['EventCategory'];
            var evtTime = evtObj['EventTime'];
            var evtName = evtObj['EventName'];
            var evtData = evtObj['EventData'];
            var evtParams = evtObj['EventParams'];
            var companyId = evtObj['CompanyId'];
            var tenantId = evtObj['TenantId'];
            var sessionId = evtObj['SessionId'];

            var evt = dbModel.DVPEvent.build({
                SessionId: sessionId,
                EventName: evtName,
                CompanyId: companyId,
                TenantId: tenantId,
                EventClass: evtClass,
                EventType: evtType,
                EventCategory: evtCategory,
                EventTime: evtTime,
                EventData: evtData,
                EventParams: JSON.stringify(evtParams)

            });

            dbBackendHandler.AddEventData(evt, function(err, result)
            {
                if(err)
                {
                    logger.error('[DVP-EventService.DVPEVENTS] - [%s] - dbBackendHandler.AddEventData threw an exception', reqId, err);
                }
            })
        }
    }

});

server.listen(hostPort, hostIp, function () {
    console.log('%s listening at %s', server.name, server.url);
});
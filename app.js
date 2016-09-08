//Subscribe to event channel
var redisHandler = require('./RedisHandler.js');
var dbBackendHandler = require('./DbBackendHandler.js');
var dbModel = require('dvp-dbmodels');
var restify = require('restify');
var config = require('config');
var stringify = require('stringify');
var nodeUuid = require('node-uuid');
var amqp = require('amqp');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;

var rmqIp = config.RabbitMQ.IpAddress;
var rmqPort = config.RabbitMQ.Port;

var server = restify.createServer({
    name: 'localhost',
    version: '1.0.0'
});

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());

server.pre(restify.pre.userAgentConnection());

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var amqpConState = 'CLOSED';

var connection = amqp.createConnection({ host: rmqIp, port: rmqPort});

connection.on('connect', function()
{
    amqpConState = 'CONNECTED';
});

connection.on('ready', function()
{
    amqpConState = 'READY';
});

connection.on('error', function()
{
    amqpConState = 'CLOSE';
});

server.get('/DVP/API/:version/EventService/Events/SessionId/:sessionId', function(req, res, next)
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

server.get('/DVP/API/:version/EventService/Events/App/:appId/SessionId/:sessionId/', function(req, res, next)
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

server.get('/DVP/API/:version/EventService/Events/EventClass/:eventClass/EventType/:eventType/EventCategory/:eventCategory', function(req, res, next)
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

            if(!companyId)
            {
                companyId = -1;
            }

            if(!tenantId)
            {
                tenantId = -1;
            }

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

            if(amqpConState === 'READY')
            {
                if(evt.EventClass && evt.EventType && evt.EventCategory)
                {
                    var exc = connection.exchange('amq.topic');

                    var pattern = evt.EventClass + '.' + evt.EventType + '.' + evt.EventCategory;

                    exc.on('open', function()
                    {
                        exc.publish(pattern, message);
                    })
                }
            }

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

function Crossdomain(req,res,next){


    var xml='<?xml version=""1.0""?><!DOCTYPE cross-domain-policy SYSTEM ""http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd""> <cross-domain-policy>    <allow-access-from domain=""*"" />        </cross-domain-policy>';

    var xml='<?xml version="1.0"?>\n';

    xml+= '<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">\n';
    xml+='';
    xml+=' \n';
    xml+='\n';
    xml+='';
    req.setEncoding('utf8');
    res.end(xml);

}

function Clientaccesspolicy(req,res,next){


    var xml='<?xml version="1.0" encoding="utf-8" ?>       <access-policy>        <cross-domain-access>        <policy>        <allow-from http-request-headers="*">        <domain uri="*"/>        </allow-from>        <grant-to>        <resource include-subpaths="true" path="/"/>        </grant-to>        </policy>        </cross-domain-access>        </access-policy>';
    req.setEncoding('utf8');
    res.end(xml);

}

server.get("/crossdomain.xml",Crossdomain);
server.get("/clientaccesspolicy.xml",Clientaccesspolicy);
//Subscribe to event channel
"use strict";
var dbBackendHandler = require('./DbBackendHandler.js');
var dbModel = require('dvp-dbmodels');
var restify = require('restify');
var jwt = require('restify-jwt');
var secret = require('dvp-common-lite/Authentication/Secret.js');
var authorization = require('dvp-common-lite/Authentication/Authorization.js');
var config = require('config');
var stringify = require('stringify');
var nodeUuid = require('node-uuid');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common-lite/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var util = require('util');
var moment = require('moment');
var amqp = require('amqp');
var healthcheck = require('dvp-healthcheck/DBHealthChecker');

var hostIp = config.Host.Ip;
var hostPort = config.Host.Port;
var hostVersion = config.Host.Version;


process.on("uncaughtException", function(err) {
  console.error(err);
  console.log("[Unhandled Exception] Node Exiting...");
  process.exit(1);
});

process.on("unhandledRejection", err => {
  console.error(err);
  console.log("[Unhandled Rejection] Node Exiting...");
  process.exit(1);
});

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
server.use(jwt({secret: secret.Secret}).unless({path: ['/healthcheck']}));

var hc = new healthcheck(server, {pg: dbModel.SequelizeConn});  // redis not used as RedisHandler is commented
hc.Initiate();

server.get('/DVP/API/:version/EventService/Events/SessionId/:sessionId', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];
    try
    {
        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }
        var sessionId = req.params.sessionId;
        logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - HTTP Request Received - Params - sessionId : %s', reqId, sessionId);

        if(sessionId && sessionId!= '') {
            dbBackendHandler.GetEventDataBySessionId(sessionId, function (err, evtList) {
                if (err) {
                    logger.error('[DVP-EventService.GetAllEventsBySessionId] - [%s] - dbBackendHandler.GetEventDataBySessionId threw an exception', reqId, err);
                    var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                    logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else {
                    var jsonString = messageFormatter.FormatMessage(null, "Operation Success", true, evtList);
                    logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }


            });
        }else{

            var jsonString = messageFormatter.FormatMessage(undefined, "Empty session id", false, emptyArr);
            logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
            res.end(jsonString);
        }

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetAllEventsBySessionId] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Operation Fail", false, emptyArr);
        logger.debug('[DVP-EventService.GetAllEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/:version/EventService/Events/App/:appId/SessionId/:sessionId/', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

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
                        var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                        logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }
                    else
                    {
                        var jsonString = messageFormatter.FormatMessage(null, "Operation Success", true, evtList);
                        logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                        res.end(jsonString);
                    }


                })
            }
            else
            {
                if(err)
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                    logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }
                else
                {
                    var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                    logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
                    res.end(jsonString);
                }

            }


        })

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Operation Fail", false, emptyArr);
        logger.debug('[DVP-EventService.GetAllDevEventsBySessionId] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/:version/EventService/Events/EventClass/:eventClass/EventType/:eventType/EventCategory/:eventCategory', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

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

server.post('/DVP/API/:version/EventService/EventsByNodes/App/:appId/Type/:type', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

    try
    {
        var nodes = req.body.nodes;
        var appId = req.params.appId;
        var page = req.query.page;
        var pageSize = req.query.pgSize;
        var startDate = req.query.startDate;
        var endDate = req.query.endDate;
        var type = req.params.type;

        logger.debug('[DVP-EventService.EventsByNodes] - [%s] - HTTP Request Received - Params - AppId : %s, Nodes : %s, Page : %s, PageSize: %s', reqId, appId, JSON.stringify(nodes), page, pageSize);

        dbBackendHandler.GetAllEventsByNodes(startDate, endDate, type, appId, companyId, tenantId, nodes, pageSize, (page - 1)*pageSize, function(err, evtList)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, emptyArr);
                logger.debug('[DVP-EventService.EventsByNodes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(null, "SUCCESS", true, evtList);
                logger.debug('[DVP-EventService.EventsByNodes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, emptyArr);
        logger.debug('[DVP-EventService.EventsByNodes] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.post('/DVP/API/:version/EventService/EventsByNodes/App/:appId/Type/:type/Count', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

    try
    {
        var nodes = [];

        if(req.body)
        {
            nodes = req.body.nodes;
        }
        var appId = req.params.appId;
        var startDate = req.query.startDate;
        var endDate = req.query.endDate;
        var type = req.params.type;

        logger.debug('[DVP-EventService.EventsByNodesCount] - [%s] - HTTP Request Received - Params - AppId : %s, Nodes : %s', reqId, appId, JSON.stringify(nodes));

        dbBackendHandler.GetAllEventsByNodesCount(startDate, endDate, type, appId, companyId, tenantId, nodes, function(err, evtList)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "ERROR", false, emptyArr);
                logger.debug('[DVP-EventService.EventsByNodesCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(null, "SUCCESS", true, evtList);
                logger.debug('[DVP-EventService.EventsByNodesCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "ERROR", false, emptyArr);
        logger.debug('[DVP-EventService.EventsByNodesCount] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/:version/EventService/Events/NodeTypes', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

    try
    {
       logger.debug('[DVP-EventService.GetNodeTypes] - [%s] - HTTP Request Received', reqId);

        dbBackendHandler.GetEventNodes(companyId, tenantId, function(err, nodeTypes)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                logger.debug('[DVP-EventService.GetNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(null, "Operation Success", true, nodeTypes);
                logger.debug('[DVP-EventService.GetNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }


        })

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Operation Fail", false, emptyArr);
        logger.debug('[DVP-EventService.GetNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.post('/DVP/API/:version/EventService/Events/NodeType', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

    try
    {
        var evtNodeInfo = req.body;
        logger.debug('[DVP-EventService.SaveNodeTypes] - [%s] - HTTP Request Received', reqId);

        dbBackendHandler.SaveEventNode(evtNodeInfo, companyId, tenantId, function(err, result)
        {
            if(err)
            {
                var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, null);
                logger.debug('[DVP-EventService.SaveNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = messageFormatter.FormatMessage(null, "Operation Success", true, result);
                logger.debug('[DVP-EventService.SaveNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }


        })

    }
    catch(ex)
    {
        var jsonString = messageFormatter.FormatMessage(ex, "Operation Fail", false, null);
        logger.debug('[DVP-EventService.SaveNodeTypes] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});

server.post('/DVP/API/:version/EventService/Events/App/:appId/Type/:type/NodeCount', authorization({resource:"events", action:"read"}), function(req, res, next)
{
    var reqId = nodeUuid.v1();
    var emptyArr = [];

    var companyId = req.user.company;
    var tenantId = req.user.tenant;

    if (!companyId || !tenantId)
    {
        throw new Error("Invalid company or tenant");
    }

    try {
        var type = req.params.type;
        var appId = req.params.appId;

        var start;
        var end;
        if(req.query){

            start = req.query['start'];
            end = req.query['end'];

        }

        var nodes = [];

        if(req.body && req.body.nodes)
        {
            nodes = req.body.nodes
        }


        //logger.debug('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - HTTP Request Received - Params - sessionId : %s, appId : %s', reqId, sessionId, appId);


        dbBackendHandler.GetDevEventDataByAppIdAndDateRange(type,appId,start,end, nodes, companyId, tenantId, function (err, evtList) {
            if (err) {
                logger.error('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - dbBackendHandler.GetDevEventDataBySessionId threw an exception', reqId, err);
                var jsonString = messageFormatter.FormatMessage(err, "Operation Fail", false, emptyArr);
                logger.debug('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }
            else {
                var jsonString = messageFormatter.FormatMessage(null, "Operation Success", true, evtList);
                logger.debug('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - API RESPONSE : %s', reqId, jsonString);
                res.end(jsonString);
            }


        })

    }
    catch(ex)
    {
        logger.error('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - Exception occurred', reqId, ex);
        var jsonString = messageFormatter.FormatMessage(ex, "Operation Fail", false, emptyArr);
        logger.debug('[DVP-EventService.GetDevEventDataByAppIdAndDateRange] - [%s] - API RESPONSE : %s', reqId, jsonString);
        res.end(jsonString);
    }

    return next();

});




/*if(config.evtConsumeType === 'amqp')
{
    var amqpConState = 'CLOSED';

    // var connection = amqp.createConnection({ host: rmqIp, port: rmqPort, login: rmqUser, password: rmqPassword});

    var ips = [];
    if(config.RabbitMQ.ip) {
        ips = config.RabbitMQ.ip.split(",");
    }


    var connection = amqp.createConnection({
        //url: queueHost,
        host: ips,
        port: config.RabbitMQ.port,
        login: config.RabbitMQ.user,
        password: config.RabbitMQ.password,
        vhost: config.RabbitMQ.vhost,
        noDelay: true,
        heartbeat:10
    }, {
        reconnect: true,
        reconnectBackoffStrategy: 'linear',
        reconnectExponentialLimit: 120000,
        reconnectBackoffTime: 1000
    });

    //logger.debug('[DVP-EventMonitor.handler] - [%s] - AMQP Creating connection ' + rmqIp + ' ' + rmqPort + ' ' + rmqUser + ' ' + rmqPassword);

    connection.on('connect', function()
    {
        amqpConState = 'CONNECTED';
        logger.debug('[DVP-EventService.AMQPConnection] - [%s] - AMQP Connection CONNECTED');
    });

    connection.on('ready', function()
    {
        amqpConState = 'READY';

        logger.debug('[DVP-EventService.AMQPConnection] - [%s] - AMQP Connection READY');

        connection.queue('DVPEVENTS', {durable: true, autoDelete: false}, function (q) {
            q.bind('#');

            // Receive messages
            q.subscribe(function (message) {
                // Print messages to stdout
                var reqId = nodeUuid.v1();
                var evtObj = message;

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


                if(evtParams && util.isObject(evtParams)){

                    evtParams = JSON.stringify(evtParams);
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
                    EventParams: evtParams

                });

                dbBackendHandler.AddEventData(evt, function(err, result)
                {
                    if(err)
                    {
                        logger.error('[DVP-EventService.DVPEVENTS] - [%s] - dbBackendHandler.AddEventData threw an exception', reqId, err);
                    }
                })


            });

        });
    });

    connection.on('error', function(e)
    {
        logger.error('[DVP-EventMonitor.handler] - [%s] - AMQP Connection ERROR', e);
        amqpConState = 'CLOSE';
    });

}
else
{
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


                if(evtParams && util.isObject(evtParams)){

                    evtParams = JSON.stringify(evtParams);
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
                    EventParams: evtParams

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
}*/





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

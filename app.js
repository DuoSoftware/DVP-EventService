//Subscribe to event channel
var redisHandler = require('./RedisHandler.js');
var dbBackendHandler = require('./DbBackendHandler.js');
var dbModel = require('DVP-DBModels');
var restify = require('restify');
var config = require('config');
var stringify = require('stringify');

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
    var emptyArr = [];
    try
    {
        var sessionId = req.params.sessionId;

        dbBackendHandler.GetEventDataBySessionId(sessionId, function(err, evtList)
        {
            var jsonStr = JSON.stringify(evtList);

            res.end(jsonStr);
        })

    }
    catch(ex)
    {
        var jsonString = JSON.stringify(emptyArr);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/' + hostVersion + '/EventService/GetAllDevEventsBySessionId/:sessionId/:appId', function(req, res, next)
{
    var emptyArr = [];
    try
    {
        var sessionId = req.params.sessionId;
        var appId = req.params.appId;

        dbBackendHandler.GetCallCDRForAppAndSessionId(appId, sessionId, function(err, cdr)
        {
            if(cdr)
            {
                dbBackendHandler.GetDevEventDataBySessionId(sessionId, function(err, evtList)
                {
                    var jsonStr = JSON.stringify(evtList);

                    res.end(jsonStr);
                })
            }
            else
            {
                var jsonStr = JSON.stringify(emptyArr);

                res.end(jsonStr);
            }


        })

    }
    catch(ex)
    {
        var jsonString = JSON.stringify(emptyArr);
        res.end(jsonString);
    }

    return next();

});

server.get('/DVP/API/' + hostVersion + '/EventService/GetAllEventsByClassTypeCategory/:eventClass/:eventType/:eventCategory', function(req, res, next)
{
    var emptyArr = [];
    try
    {
        var evtClass = req.params.eventClass;
        var evtType = req.params.eventType;
        var evtCategory = req.params.eventCategory;

        dbBackendHandler.GetEventDataByClassTypeCat(evtClass, evtType, evtCategory, function(err, evtList)
        {
            var jsonStr = JSON.stringify(evtList);

            res.end(jsonStr);
        })

    }
    catch(ex)
    {
        var jsonString = JSON.stringify(emptyArr);
        res.end(jsonString);
    }

    return next();

});


redisHandler.RedisSubscribe('SYS:MONITORING:DVPEVENTS');

redisHandler.redisClient.on('message', function(channel, message)
{
    if(channel && channel === 'SYS:MONITORING:DVPEVENTS')
    {
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
                    console.log(err);
                }
                else
                {
                    console.log('Event Data Added');
                }
            })
        }
    }

});

server.listen(hostPort, hostIp, function () {
    console.log('%s listening at %s', server.name, server.url);
});
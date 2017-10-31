"use strict";
var redis = require("ioredis");
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;

var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port && config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var client = undefined;

if(redismode != "cluster") {
    client = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        var client = new redis.Cluster([redisSetting]);

    }else{

        client = new redis(redisSetting);
    }


}

var RedisSubscribe = function(channel)
{
    try
    {
        var sub = client.subscribe(channel);

        logger.debug('[DVP-EventService.RedisSubscribe] REDIS SUBSCRIBED');
    }
    catch(ex)
    {
        logger.error('[DVP-EventService.RedisSubscribe] REDIS ERROR', ex);
    }
};

var GetObject = function(reqId, key, callback)
{
    try
    {
        logger.debug('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - Method Params - key : %s', reqId, key);


        client.get(key, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - REDIS GET failed', reqId, err);
            }
            else
            {
                logger.debug('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - REDIS GET success', reqId);
            }

            callback(err, JSON.parse(response));
        });

    }
    catch(ex)
    {
        logger.error('[DVP-DynamicConfigurationGenerator.GetObject] - [%s] - Exception occurred', reqId, ex);
        callback(ex, undefined);
    }
};

var SetObject = function(key, value, callback)
{
    try
    {
        //var client = redis.createClient(redisPort, redisIp);

        client.set(key, value, function(err, response)
        {
            if(err)
            {
                logger.error('[DVP-EventService.SetObject] REDIS ERROR', err);
            }
            else
            {
                logger.debug('[DVP-EventService.SetObject] REDIS SUCCESS', err);
            }
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var PublishToRedis = function(pattern, message, callback)
{
    try
    {
       
        var result = client.publish(pattern, message);
        callback(undefined, true);

    }
    catch(ex)
    {
        callback(ex, undefined);
    }
}

var GetFromSet = function(setName, callback)
{
    try
    {
        client.smembers(setName).keys("*", function (err, setValues)
            {
                if(err)
                {
                    logger.error('[DVP-EventService.GetFromSet] REDIS ERROR', err);
                }
                else
                {
                    logger.debug('[DVP-EventService.GetFromSet] REDIS SUCCESS', err);
                }
                callback(err, setValues);
            });


    }
    catch(ex)
    {
        callback(ex, undefined);
    }
};

client.on('error', function(msg)
{
    console.log(msg);

});

module.exports.SetObject = SetObject;
module.exports.PublishToRedis = PublishToRedis;
module.exports.GetFromSet = GetFromSet;
module.exports.RedisSubscribe = RedisSubscribe;
module.exports.GetObject = GetObject;
module.exports.redisClient = client;

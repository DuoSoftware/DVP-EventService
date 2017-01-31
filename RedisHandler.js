var redis = require("redis");
var Config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var redisIp = Config.Redis.ip;
var redisPort = Config.Redis.port;
var redisPassword = Config.Redis.password;

var client = redis.createClient(redisPort, redisIp);

client.auth(redisPassword, function (redisResp) {
    console.log("Redis Auth Response : " + redisResp);
});

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
        if(client.connected)
        {
            var result = client.publish(pattern, message);
        }
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
        if(client.connected)
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
        else
        {
            callback(new Error('Redis Client Disconnected'), undefined);
        }


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
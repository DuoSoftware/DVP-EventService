var redis = require("redis");
var Config = require('config');

var redisIp = Config.Redis.IpAddress;
var redisPort = Config.Redis.Port;

var client = redis.createClient(redisPort, redisIp);

var RedisSubscribe = function(channel)
{
    try
    {
        var sub = client.subscribe(channel);
    }
    catch(ex)
    {

    }
};

var SetObject = function(key, value, callback)
{
    try
    {
        //var client = redis.createClient(redisPort, redisIp);

        client.set(key, value, function(err, response)
        {
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
module.exports.redisClient = client;
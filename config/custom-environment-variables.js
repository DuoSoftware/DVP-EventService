module.exports = {

    "DB": {
        "Type":"SYS_DATABASE_TYPE",
        "User":"SYS_DATABASE_POSTGRES_USER",
        "Password":"SYS_DATABASE_POSTGRES_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DATABASE_HOST",
        "Database":"SYS_DATABASE_POSTGRES_USER"
    },

    "Redis":
    {
        "IpAddress": "SYS_REDIS_HOST",
        "Port": "SYS_REDIS_PORT"

    },

    "RabbitMQ": {
        "IpAddress":"SYS_RABBITMQ_HOST",
        "Port":"SYS_RABBITMQ_PORT"
    },

    "Host":{
        "Port":"HOST_EVENTSERVICE_PORT",
        "Version":"HOST_VERSION"
    }
};
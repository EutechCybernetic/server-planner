export const ENV:any = {
    iviva: `
IVIVA_ACCOUNT='#{settings.account}'
DB_HOST='#{sqlserver.ip}'
DB_PORT='1433'
DB_USERNAME='sa'
DB_PASSWORD='#{settings.sqlpassword}'
REDIS_HOST=#{redis.ip}
REDIS_PORT=6379`,
    influxdb:`
DOCKER_INFLUXDB_INIT_USERNAME='iviva'
DOCKER_INFLUXDB_INIT_PASSWORD='#{settings.influxdbpassword}'
DOCKER_INFLUXDB_INIT_ADMIN_TOKEN='#{settings.influxdbtoken}'
DOCKER_INFLUXDB_INIT_BUCKET='UMS_#{settings.account}'
    `,
    ivivaweb:`
IVIVA_BRE_URL='http://#{reportengine.ip}:21002'
    `,
    ums:`
UMSSERVICE_UMS_INFLUX_URL='http://#{influxdb.ip}:8086'
UMSSERVICE_UMS_INFLUX_TOKEN='#{settings.influxdbtoken}'
UMSSERVICE_UMS_MONGO_URL='mongodb://#{mongodb.ip}:27017'
UMSSERVICE_UMS_SKIP_BUCKET_CREATE='1'
UMSAPP_LUCY_HTTP_URL='http://#{lucy.ip}:9111'
UMSAPP_MONGO_URL='mongodb://#{mongodb.ip}:27017'
UMSAPP_UMS_SERVICE_URL='http://#{ums.ip}:5122'
UMSAPP_ACCOUNT_DB_CS='user id=sa;pwd=#{settings.sqlpassword};data source=#{sqlserver.ip};initial catalog=asp'
    `,
    queryengine:`
QUERYENGINE_VERSION='v1'
QUERYENGINE_DB='user id=sa;pwd=#{settings.sqlpassword};data source=#{sqlserver.ip};initial catalog=asp'
QUERYENGINE_MONGO_URI='mongodb://#{mongodb.ip}:27017'
    `,
    reportengine:`
BOLDREPORTS_LUCY_URL='http://#{lucy.ip}:9111'
    `
};
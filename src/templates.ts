export const ENV:any = {
    iviva: `
IVIVA_ACCOUNT='#{settings.account}'
DB_HOST='#{sqlserver.ip}'
DB_PORT='1433'
DB_USERNAME='sa'
DB_PASSWORD='#{settings.sqlServerPassword}'
REDIS_HOST=#{redis.ip}
REDIS_PORT=6379`,
    influxdb:`
DOCKER_INFLUXDB_INIT_USERNAME='#{settings.influxDBUser}'
DOCKER_INFLUXDB_INIT_PASSWORD='#{settings.influxDBPassword}'
DOCKER_INFLUXDB_INIT_ADMIN_TOKEN='#{settings.influxDBToken}'
DOCKER_INFLUXDB_INIT_BUCKET='UMS_#{settings.account}'
    `,
    ivivaweb:`
IVIVA_BRE_URL='http://#{reportengine.ip}:21002'
    `,
    ums:`
UMSSERVICE_UMS_INFLUX_URL='http://#{influxdb.ip}:8086'
UMSSERVICE_UMS_INFLUX_TOKEN='#{settings.influxDBToken}'
UMSSERVICE_UMS_MONGO_URL='mongodb://#{mongodb.ip}:27017'
UMSSERVICE_UMS_SKIP_BUCKET_CREATE='1'
UMSAPP_LUCY_HTTP_URL='http://#{lucy.ip}:9111'
UMSAPP_MONGO_URL='mongodb://#{mongodb.ip}:27017'
UMSAPP_UMS_SERVICE_URL='http://#{ums.ip}:5122'
UMSAPP_ACCOUNT_DB_CS='user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=asp'
    `,
    queryengine:`
QUERYENGINE_VERSION='v1'
QUERYENGINE_DB='user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=asp'
QUERYENGINE_MONGO_URI='mongodb://#{mongodb.ip}:27017'
    `,
    reportengine:`
BOLDREPORTS_LUCY_URL='http://#{lucy.ip}:9111'
    `
};
export const YAML = `
---
  configuration:
    settings:
      # DB
      #
      DB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=asp
      JobQueueDB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=JobQueueDB
      MessagingDB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=MessagingDB
      LucyEventDB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=LucyEventDB
      GroupDB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=ProcessDB
      GroupADB: user id=#{settings.sqlServerUser};pwd=#{settings.sqlServerPassword};data source=#{sqlserver.ip};initial catalog=ProcessDB
      # redis
      #
      RedisServer: #{redis.ip}:6379
      # mongodb
      #
      MongoDBServer: mongodb://#{mongodb.ip}:27017
      # iviva
      #
      FileServer: /iviva/uploads
      AccountUrl: http://#{ivivaweb.ip}
      BaseDomain: #{ivivaweb.ip}
      UrlPattern: SubDomain
      TempFileLocation: /tmp/iviva/uploads
      Iviva.Server.Host: http://0.0.0.0:80
      OauthCallbackUri: https://oauth.ivivacloud.com/callback
      Iviva.FileManager.Uploads: /iviva/uploads/filemanager
      Iviva.FileManager.TempUploads: /tmp/iviva/uploads/filemanager
      # iviva & lucy
      MaxUploadFileSizeMB: 100
      SaveAttachmentsToFileServer: 1
      MaxDBUploadFileSizeMB: 20
      LargeUploadFileSizeMB: 5
      MaxUploadChunkSizeMB: 5
      #
      Path: /iviva/apps
      SystemPath: /iviva/ivivaweb
      CustomAppsPath: 
      CustomAppRepositoryPath: 
      LogPath: /var/log/iviva
      # lucy
      #
      LucyServer: #{lucy.ip}:9090
      LucyEngine.Clustered: 1
      LucyEngine.ClusterLockTime: 3
      Lucy.EnableCors: 1
      LucyEngine.HttpServer.Host: +
      LucyEngine.HttpServer.Port: 9111
      LucyEngine.TimeSeries.InfluxUrl: http://#{influxdb.ip}:8086
      LucyEngine.TimeSeries.MinFlushThreshold: 1
      LucyEngine.FileManager.Url: http://#{hermes.ip}:20000
      LucyEngine.HydraHost: hydra
      LucyEngine.HydraPort: 7000
      LucyEngine.DebugDataStore: mongodb://#{mongodb.ip}:27017
      # Email Gateway
      #
      EmailGateway.EmailAddress: #{settings.emailAddress}
      EmailGateway.Host: #{settings.smtpServer}
      EmailGateway.Port: 587
      EmailGateway.UseSSL: 1
      EmailGateway.User: #{settings.emailUser}
      EmailGateway.Password: #{settings.emailPassword}
      Clustered: 1
      # process
      #
      ProcessEngine.Groups: A
      ProcessEngine.Clustered: 1
      ProcessEngine.Threads: 1
      ProcessEngine.SleepTime: 1000
      ProcessEngine.EnableDebugging: 1
      # Service Registries
      #
      ServiceRegistry.UMS: http://#{ums.ip}:22314
      ServiceRegistry.QueryEngine: http://#{queryengine.ip}:21003
      # report engines
      #
      ReportEngine.Plugins: /iviva/ReportEngines/CrystalReportsEngine/CrystalReportsEngine.dll,/iviva/ReportEngines/BoldReportEngine/BoldReportEngine.dll
    account_domain_map:
`;
export const START_SCRIPT = `
#!/bin/sh
# #{server.name}
sudo docker compose up -d #{docker.profiles}
`;

export const SETUP_SCRIPT = `
#!/bin/sh
LICENSE_KEY="#{settings.licenseKey}"
curl -s https://docker
curl -s -o docker-compose.yml -H "X-IVIVA-LICENSE-KEY: $LICENSE_KEY" "http://releases.ivivacloud.com/docker/releases/4.1.0/docker-compose.yml"
curl "https://license.iviva.com/login?key=$LICENSE_KEY" -s | docker login iviva.azurecr.io -u 001509a7-8269-46bd-b376-3d2dcdabd8da --password-stdin
`;
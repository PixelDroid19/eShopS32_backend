module.exports = {
  apps: [{
    name: 'eShopS32_backend',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_restarts: 10,
    restart_delay: 4000,
    wait_ready: true,
    kill_timeout: 3000,
    listen_timeout: 3000
  }]
}
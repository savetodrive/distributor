set :application, 'distributor'
set :repo_url, 'git@bitbucket.org:savetodrive/distributor.git'

set :deploy_to, '/home/savetodrive/distributor'

# Default branch is :master
set :branch, ENV['branch'] || 'master'

# Whether to restart the application or to gracefully reload the app
# default is false which means the application is gracefully reloaded
set :restart, ENV['restart'] || 'false'

set :format_options, command_output: true, log_file: 'logs/capistrano.log', color: :auto, truncate: :auto

# Default value for keep_releases is 5
set :keep_releases, 3

#set :linked_files, ['config.js']

set :linked_dirs, ['storage/logs']

namespace :deploy do
  after :updated, "env:create"
  after :updated, "yarn:install"

  after :publishing, "pm2:upload_conf"
  after :published, "pm2:start"
end

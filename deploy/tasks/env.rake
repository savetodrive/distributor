require 'json'

namespace :env do
  desc 'Upload .env'
  task :create do
    on roles(:all) do
        within release_path do
            execute :cp, '~/distributor/parameters.env .env'
            execute :echo, "CURRENT_REVISION=#{fetch(:current_revision)} >> .env"
        end
    end
  end
end

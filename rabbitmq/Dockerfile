# rabbitmq/Dockerfile
FROM rabbitmq:3.13-management-alpine

# Enable the delayed message exchange plugin
RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange
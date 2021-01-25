FROM node:14.15.4-alpine3.12


ADD package.json yarn.lock /tmp/
ADD .yarn-cache.tgz /

RUN cd /tmp && yarn
RUN mkdir -p /service && cd /service && ln -s /tmp/node_modules

COPY . /usr/src/app
WORKDIR /usr/src/app

ENV FORCE_COLOR=1

RUN yarn install

# unncesssary?
# COPY . .

EXPOSE 18545
EXPOSE 9090

ENTRYPOINT ["npm"]
CMD ["start"]

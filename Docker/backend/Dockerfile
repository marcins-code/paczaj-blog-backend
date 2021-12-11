# pull official base image
FROM node:16-buster
ENV NODE_ENV=docker
# set working directory
# We select this directory because webstorm requires this path for remote debugging setup.
WORKDIR /usr/src/app
# Docker images are created layer by layer, so when we are just coping package.json files it would not get build everytime
# we do any update on the files apart from package.json. It only gets rebuild when we add a new package or we change something on the package.json file.
# We generally create the package required layer first and then load the code file, so that the build get triggered only when we do any update on requirements.
# If we copy the whole codebase then the image will have to rebuild always since the layer on which we are loading the files updates on every code update.
COPY ../../package.json ../../package-lock.json /usr/src/app/
COPY ../../private.key /usr/src/app/
COPY ../../.env /usr/src/app/
RUN npm install -g npm@7.24.1
RUN npm install --production
RUN npm install -g nodemon

#COPY  ./app_backend/dist:/opt/project/dist
CMD ["npm","run", "start"]

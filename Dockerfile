# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/bridge

# Copy package.json and package-lock.json to the working directory
COPY package*.json yarn.lock ./

# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

# Define the command to run your application
CMD ["yarn", "start"]

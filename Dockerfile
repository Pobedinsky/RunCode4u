FROM node:14

# Install OCaml
RUN apt-get update && apt-get install -y ocaml

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]

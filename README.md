121 platform
============

121 is an open source platform for Cash based Aid built with Digital Identity & Local/Global Financial service partners.  -- Learn more about the platform: <https://www.121.global/>

---

## Status

| Interfaces       | Build Status                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-App           | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/PA-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=17&branchName=master)                |
| PA-App (Android) | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/PA-App%20--%20Android?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=23&branchName=master) |
| AW-App           | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/AW-App?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=18&branchName=master)                |
| HO-Portal        | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Interfaces/HO-Portal?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=13&branchName=master)             |

| Services            | Build Status                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 121-service         | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/121-service?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=12&branchName=master)           |
| PA-accounts-service | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/PA-accounts-service?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=19&branchName=master)   |
| Tykn-SSI-Services   | [![Build Status](https://dev.azure.com/redcrossnl/121%20Platform/_apis/build/status/Services/Tykn%20SSI%20Services?branchName=master)](https://dev.azure.com/redcrossnl/121%20Platform/_build/latest?definitionId=20&branchName=master) |

## Documentation
The documentation of the 121 platform can be found on the Wiki of this repository on GitHub.


## Getting Started
To set up a local development-environment:


Guide to setup local development environment for 121.

The repository as can be seen contains, services and interfaces directories. The services are run using docker environment and the interfaces are individual Angular applications.

# 1. Windows OS
## Install dependencies
### Install Node.js (https://nodejs.org/en/download/)
#### Choose an appropriate executable to install node.js
### Install Git (https://git-scm.com/download/win)
### Install Docker (https://docs.docker.com/docker-for-windows/install/)

## Setup Repository
Download/Clone the Git repository.

    git clone https://github.com/global-121/121-platform.git


## Setup Interfaces
Install dependencies for interfaces. Through command line navigate to each interface directory and install dependencies

    cd interfaces/AW-App
    npm install

    cd interfaces/HO-Portal
    npm install

    cd interfaces/PA-App
    npm install

## Setup services

Switch to the repository folder

    cd services/

Copy a few secret files and get the right passwords:

    cp .env.example .env
    cp 121-service/src/example.secrets.ts 121-service/src/secrets.ts
    cp 121-service/example.ormconfig.json 121-service/ormconfig.json
    cp PA-accounts-service/src/example.secrets.ts PA-accounts-service/src/secrets.ts
    cp PA-accounts-service/example.ormconfig.json PA-accounts-service/ormconfig.json

Environment variables are explained in the comments of the .env.example


# 2. Linux
## Install dependencies
### Node.JS

        sudo apt install nodejs

### Install Git

        sudo apt install git-all

### Install Docker

On linux distributions we need to install docker enginer and docker compose respectively. On other platforms docker-compose enginer is available through Docker Desktop. Read more at: https://docs.docker.com/engine/install/

Docker compose relies on docker engine, so in order to get started we must install docker-engine first. (Read more at: https://docs.docker.com/engine/install/ubuntu/). Theere are various ways of installing docker engine (repository, packages or automated scripts). The official recommended way doing that is through setting up a repository.

#### First off, uninstall any old version of docker-engine.

    sudo apt-get remove docker docker-engine docker.io containerd runc

#### Choose an installation method from the provided list at https://docs.docker.com/engine/install/ubuntu/#installation-methods and install docker-engine

#### Test your docker installation

     sudo docker run hello-world

#### Now install docker-compose
Can be done by following the steps at: https://docs.docker.com/compose/install/

    sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

    sudo chmod +x /usr/local/bin/docker-compose

#### Test the docker compose installation

    docker-compose --version

You are set!

## Setup Repository
Download/Clone the Git repository, so we can run the services and interfaces.

    git clone https://github.com/global-121/121-platform.git


## Setup Interfaces
Install dependencies for interfaces. Through command line navigate to each interface directory and install dependencies

    cd interfaces/AW-App
    npm install

    cd interfaces/HO-Portal
    npm install

    cd interfaces/PA-App
    npm install

## Setup services

Switch to the repository folder

    cd services/

Copy a few secret files and get the right passwords:

    cp .env.example .env
    cp 121-service/src/example.secrets.ts 121-service/src/secrets.ts
    cp 121-service/example.ormconfig.json 121-service/ormconfig.json
    cp PA-accounts-service/src/example.secrets.ts PA-accounts-service/src/secrets.ts
    cp PA-accounts-service/example.ormconfig.json PA-accounts-service/ormconfig.json

Environment variables are explained in the comments of the .env.example
- Run: `npm run install:all` from *this* folder
- Run: `npm run start:all` from *this* folder

In order to start either of the interfaces on development mode:
- change directory to the respective interface `cd interfaces/*` and run `npm start`
- or to run on an Android-device:
      npm run dev:on-device

For more options, see the documentation of the [Ionic/Cordova CLI](https://ionicframework.com/docs/cli/commands/cordova-run).

# 3. MacOS
## Install dependencies
### Install Node.js (https://nodejs.org/en/download/)
#### Choose an appropriate executable to install node.js
### Install Git https://git-scm.com/book/en/v2/Getting-Started-Installing-Git > Installing on macOS (section)
### Install Docker (https://docs.docker.com/docker-for-mac/install/)

## Setup Repository
Download/Clone the Git repository.

    git clone https://github.com/global-121/121-platform.git


## Setup Interfaces
Install dependencies for interfaces. Through command line navigate to each interface directory and install dependencies

    cd interfaces/AW-App
    npm install

    cd interfaces/HO-Portal
    npm install

    cd interfaces/PA-App
    npm install

## Setup services

Switch to the repository folder

    cd services/

Copy a few secret files and get the right passwords:

    cp .env.example .env
    cp 121-service/src/example.secrets.ts 121-service/src/secrets.ts
    cp 121-service/example.ormconfig.json 121-service/ormconfig.json
    cp PA-accounts-service/src/example.secrets.ts PA-accounts-service/src/secrets.ts
    cp PA-accounts-service/example.ormconfig.json PA-accounts-service/ormconfig.json

Environment variables are explained in the comments of the .env.example

## Testing
- Scenarios of end-to-end/integration-tests for the whole platform are described in [`/features`](features/#readme).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and integration-tests for all services; Run with `npm test` in each `services/*`-folder.


## Releases
See notable changes and the currently release version in the [CHANGELOG](CHANGELOG.md).

### Release Checklist
This is how we create and publish a new release of the 121-platform.  
(See [the glossary](#glossary) for definitions of some terms.)

- [ ] Define the date/time of the release. (Notify the dev-team for a code-freeze.)
- [ ] Define what code gets released. ("_Is the current `master`-branch working?_")
- [ ] Define the `version`(-number) for the upcoming release.
- [ ] Update the [CHANGELOG](CHANGELOG.md) with the date + version.
  - [ ] Commit changes to `master`-branch on GitHub.
- [ ] Create a `release`-branch ("`release/<version>`") from current `master`-branch
  - [ ] Push this branch to GitHub
- [ ] Run the [Azure Pipelines](https://dev.azure.com/redcrossnl/121%20Platform/_build) for the native Android-apps on that `release`-branch
  - [ ] Download the generated artifacts (`PA-App.zip`)
  - [ ] Rename to match the version (i.e: `PA-App-v0.1.0.zip`)
- [ ] "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub  
  - [ ] Add the `version` to create a new tag
  - [ ] Select the new `release/<version>`-branch
  - [ ] Set the title of the release to `version`
  - [ ] Add a short description and/or link to relevant other documents (if applicable)
  - [ ] Create/publish the release on GitHub

### Patch/Hotfix Checklist

This follows the same process as a regular release + deployment. With some small changes.
- Code does not need to be frozen. (As there is no active development on the release-branch)
- Checkout the `release/<version>`-branch that needs the hotfix.
- Create a new local branch (e.g. `release/<v0.x.1>`) and make the change
- Push this branch directly to a new branch in the main repository, not to a personal fork.
- Create a new release (see above) and publish it
- The publish-command will invoke a webhook-signal, leading to an automatic deploy
- After the hotfix-release, apply the same fix (if applicable) to the master-branch in a regular PR (by creating a PR from the hotfix-branch to `master`-branch)
- Finally, add the hotfix-release to the [CHANGELOG](CHANGELOG.md) in the master-branch


## Deployment

### To "test" environment
- Merged PR's to 'master' branch are automatically deployed to the test-server. (via [webhook](tools/webhook.service), see: [/tools#GitHub-webhook](tools/README.md#github-webhook))
  - To skip deployment after a PR is merged, add `[SKIP CD]` to the title of the PR before merging. (For example when only updating documentation)
- Make sure to update the environment-settings as soon as possible, preferably before the merge+deploy.

### To "production" environment

#### On initial deployment (only)
- [ ] Configure environment(s) as described in [/services > Getting started / Installation](services/README.md#getting-started-installation).
  - [ ] Checkout code (of latest release)
  - [ ] Set secrets, configure ENV-variables (via all `.env`-files)
  - [ ] Build the platform (by running the [deploy script](./tools/deploy.sh)):  
        Run: `. ./tools/deploy.sh`
- [ ] Setup the web-server as described in [/tools > Hosting > Apache2](tools/README.md#apache2)
- [ ] (Optional) Add data to the database using the available [seed-script](services/121-service/README.md#Seed-the-database)

#### On next deployments
- [ ] Decide on what version to deploy
- [ ] Check for any changes/additions/removals in the [CHANGELOG](CHANGELOG.md)
- [ ] Prepare the environment accordingly (in all `.env`-files)
  - [ ] Build the platform (by running the [deploy script](./tools/deploy.sh)):  
        Run: `. ./tools/deploy.sh <target-branch>`, where `<target-branch>` is for example: `release/v0.1.0`

## Glossary

| Term          | Definition (_we_ use)                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `version`     | A 'number' specified in the [`SemVer`](https://semver.org/spec/v2.0.0.html)-format: `0.1.0`                  |
| `tag`         | A specific commit or point-in-time on the git-timeline; named after a version, i.e. `v0.1.0`                 |
| `release`     | A fixed 'state of the code-base', [published on GitHub](https://github.com/global-121/121-platform/releases) |
| `deployment`  | An action performed to get (released) code running on an environment                                         |
| `environment` | A machine that can run code (with specified settings); i.e. a server or VM, or your local machine            |

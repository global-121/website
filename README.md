# 121 platform

121 is an open source platform for Cash based Aid built with Digital Account & Local/Global Financial service partners. -- Learn more about the platform: <https://www.121.global/>

---

[![License](https://img.shields.io/github/license/global-121/121-platform?style=flat-square)](LICENSE)
[![Releases](https://img.shields.io/github/v/release/global-121/121-platform?style=flat-square)](https://github.com/global-121/121-platform/releases)

---

## Status

See: [status.121.global](https://status.121.global/)

### Tests Status

[![Test Interface: Portal](https://github.com/global-121/121-platform/actions/workflows/test_interface_portal.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_interface_portal.yml)
[![Test Service: Code](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_code.yml)
[![Test Service: API Integration](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml/badge.svg)](https://github.com/global-121/121-platform/actions/workflows/test_service_api.yml)

See: [Testing](#testing)

---

## Documentation

The documentation of the 121 platform can be found on the Wiki of this repository on GitHub: <https://github.com/global-121/121-platform/wiki>

---

## Getting Started

### Set up a local development-environment

- Install Git: <https://git-scm.com/download/>
- Install Node.js: <https://nodejs.org/en/download/>

  - Install the version specified in the [`.node-version`](.node-version)-file.
  - To prevent conflicts between projects or components using other versions of Node.js it is recommended to use a 'version manager'.

    - [FNM](https://nodejs.org/en/download/package-manager/#fnm) (for Windows/macOS/Linux

    - [NVM - Node Version Manager](http://nvm.sh/) (for macOS/Linux).

    - [NVM for Windows](https://github.com/coreybutler/nvm-windows) (for Windows))

- Install Docker

  - On Linux, install Docker Engine + Compose plugin: <https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository>
  - On macOS, install Docker Desktop: <https://docs.docker.com/docker-for-mac/install/>
  - On Windows, install Docker Desktop: <https://docs.docker.com/docker-for-windows/install/>

    If there are issues running Docker on Windows, you _might_ need to do the following:

    - Install WSL2 Linux kernel package.  
      Check step 4 on <https://learn.microsoft.com/en-us/windows/wsl/install-manual>
    - Set WSL2 as default version in PowerShell
      - `wsl --set-default-version 2`
      - Check step 5 on <https://learn.microsoft.com/en-us/windows/wsl/install-manual>

### Set up repository and code

With these tools in place you can checkout the code and start setting up:

    git clone https://github.com/global-121/121-platform.git

Navigate to the root folder of this repository:

    cd 121-platform

Then install the required version of Node.js and `npm`:

- If you use FNM: `fnm use` (And follow the prompts)

- If you use NVM

  - On macOS/Linux: `nvm install`

  - On Windows: `nvm install <version in .node-version-file>`

---

Now, make sure to run the following in the root folder to install the necessary pre-hooks:

```bash
npm install
```

## Setup Services

Switch to the repository folder

    cd services/

Copy the centralized .env file

    cp .env.example .env

Environment variables are explained in the comments of the [`.env.example`-file](./services/.env.example), some already have a value that is safe/good to use for development, some need to be unique/specific for your environment.

Some variables are for credentials or tokens to access third-party services.

## Start Services

To start all services, after setup, from the root of this repository, run:

    npm run start:services

To see the status/logs of all/a specific Docker-container(s), run: (Where `<container-name>` is optional)

    npm run logs:services <container-name>

To verify the successful installation and setup of services, access their Swagger UI:

- 121-service: <http://localhost:3000/docs/>

---

## Setup Interfaces

Follow the "[Getting started / installation](interfaces/README.md#getting-started--installation)"-section in the [interfaces/README](interfaces/README.md)-file.

Install dependencies for the portal, run:

    npm run install:portal

Also, make sure to create an env file for each interface. For example:

    cp interfaces/Portal/.env.example interfaces/Portal/.env

## Start Interfaces

To start the portal, from the root of this repository, run:

    npm run start:portal

- Or explore the specific options as defined in each interface's own `package.json` or `README.md`.

When started, the portal will be available via:

- Portal: <http://localhost:8888>

---

## Local development

When you use [VS Code](https://code.visualstudio.com/), you can start multiple editor-windows at once, from the root of this repository, run:

    npm run code:all

To start an individual interface/service in VS Code:

- Run: (where `<package>` is one of `portal`, `121-service`)

      npm run code:<package>

### Process for implementing data-model changes

When making changes to the data-model of the `121-service` (creating/editing any `\*.entity.ts` files), you need to create a migration script to take these changes into affect.

The process is:

1. Make the changes in the `\*.entity.ts` file
2. To generate a migration-script run: `docker exec 121-service npm run migration:generate src/migration/<descriptive-name-for-migration-script>`. This will compare the data-model according to your code with the data-model according to your database, and generate any CREATE, ALTER, etc SQL-statements that are needed to make the database align with code again.
3. Restart the 121-service through `docker restart 121-service`: this will always run any new migration-scripts (and thus update the data-model in the database), so in this case the just generated migration-script.
4. If more changes required, then follow the above process as often as needed.
5. Do NOT import any files from our code base into your migrations. For example, do NOT import seed JSON files to get data to insert into the database, since the migration may break if ever these seed JSON files change. Instead, "hard code" the needed data in your migration file.
6. Do NOT change migration files anymore after they have been merged to main, like commenting out parts of it, since there is a high probability this will result in bugs or faulty data on production instances. Instead, create a new migration file. The exception is bug fixing a migration file, for example if a file was imported that causes the migration to fail (see 5 above).
7. To run this file locally, do: `docker exec -it 121-service  npm run migration:run`
8. If you want to revert one migration you can run: `docker exec -it 121-service  npm run migration:revert`
9. If ever running into issues with migrations locally, the reset process is:

- Delete all tables in the `121-service` database schema
- Restart `121-service` container
- This will now run all migration-scripts, which starts with the `InitialMigration`-script, which creates all tables
- (Run seed)

10. See also [TypeORM migration documentation](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md) for more info

NOTE: if you're making many data-model changes at once, or are doing a lot of trial and error, there is an alternative option:

1. In `services/121-service/src/ormconfig.ts` set `synchronize` to `true` and restart `121-service`.
2. This will make sure that any changes you make to `\*.entity.ts` files are automatically updated in your database tables, which allows for quicker development/testing.
3. When you're done with all your changes, you will need to revert all changes temporarily to be able to create a migration script. There are multiple ways to do this, for example by stashing all your changes, or working with a new branch, etc. Either way:
   - stashing all your changes (git stash)
   - restart 121-service and wait until the data-model changes are actually reverted again
   - set `synchronize` back to `false` and restart 121-service
   - load your stashed changes again (git stash pop)
   - generate migration-script (see above)
   - restart 121-service (like above, to run the new migration-script)

### Authentication

All services use [JSON Web Token](https://jwt.io/) (JWT) to handle authentication. The token should be passed with each request by the browser via an `access_token` cookie. The JWT authentication middleware handles the validation and authentication of the token.

### Adding third party API tokens

All the tokens and access keys for third party APIs should be added on the .env file and subsequently imported using the environment variables within typescript files.

### Recommended code-editor/IDE tools/extensions

To help with some types if files/tasks we've listed them here:

- [Workspace recommendations for VS Code](.vscode/extensions.json)
  When you open the root-folder of this repository in VSCode and go to: "_Extensions_" and use the filter: "_Recommended_";
  A list should be shown and each extension can be installed individually.

  Generic highlights:

  - [Cucumber (Gherkin) Full Support](https://marketplace.visualstudio.com/items?itemName=alexkrechik.cucumberautocomplete) - To work with `.feature`-files for test-scenarios

  Interfaces / front-end highlights:

  - [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - To work with translations in the HTML-templates and component TS-files

## Common problems with Local Environment set-up

### Swagger-UI not accessible

If the Swagger-UI is not accessible after installing Docker and setting up the services, you can take the following steps to debug:

1. `docker compose ps` to list running containers and their status
2. `docker compose logs -f <container-name>` to check their logs/console output (or leave out the `<container-name>` to get ALL output)

### Docker related issues

If there are issues with Docker commands, it could be due to permissions. Prefix your commands with `sudo docker....`

### Database related errors

If the errors are related to not being able to access/connect to the database then reset/recreate the database by:

- Setting `dropSchema: true` in `src/ormconfig.ts` of the specific service.
- Restarting that service will reset/recreate its database(-schema)

### Upgrade Node.js version

When considering upgrading the (LTS) version of the Node.js runtime, take into account:

- The Node.js Release schedule: <https://github.com/nodejs/release#release-schedule>
- The (specific) version supported by Microsoft Azure App Services,  
  in their Node.js Support Timeline: <https://github.com/Azure/app-service-linux-docs/blob/master/Runtime_Support/node_support.md>
- Angular's Actively supported versions: <https://angular.io/guide/versions#actively-supported-versions>
- Ionic Framework's supported Node.js versions: <https://ionicframework.com/docs/intro/environment#Node--npm>

### Updated/new Node.js dependencies

When new Node.js dependencies are added to a service since it is last build on you local machine, you can:

- Verify if everything is installed properly:

      docker compose exec <container-name> npm ls

- If that produces errors or reports missing dependencies, try to build the service from a clean slate with:

      npm run install:services -- --no-cache <container-name>

  Or similarly:

      npm run start:services -- --force-recreate <container-name>

---

## Testing

- Scenarios of end-to-end/integration-tests for the whole platform are described in [`/features`](features/#readme).
- Each component has its own individual tests:
  - Unit-tests and UI-tests for all interfaces; Run with `npm test` in each `interfaces/*`-folder.
  - Unit-tests and API/integration-tests for all services; Run with `npm test` in each `services/*`-folder.
    See: `121-service/README.md`/[Testing](./services/121-service/README.md#testing) for details.

### When to use an API-test? (back-end + db? only)

- Is it to test query-magic?
- Is it to test essential endpoints (FSP integrations) and import/exports/etc?
- Often used (with different parameters) endpoints: PATCH /registration etc.
- Is there actual business-logic performed?
- Not necessary:
  - update single (program) properties?
- Examples:
  - import registrations -> change PA-status (with list of refIds) -> export included PAs
  - update PA attributes: all different content-types + possible values (including edge cases)

#### Notes

These tests are still expensive (to bootstrap app + database)

### Unit Tests

#### Why?

There are a few reasons why we write unit tests cases:

- Unit tests are written to ensure the integrity the functional level aspect of the code written. It helps us identify mistakes, unnecessary code and also when there is room for improvement to make the code more intuitive and efficient.
- We also write unit test cases to clearly state what the method is supposed to do, so it is smoother for new joiners to be onboarded
- It helps us achieve recommended devOps protocols for maintaining code base while working within teams.

#### Maintenance with future changes

How are Unit Tests affected when we make changes within the code in future?

- We should aim to write and update unit tests along side the current development, so that our tests are up to date and also reflect the changes done. Helps us stay in track
- Unit tests in this case differ from manual or automated UI testing. While UI may not exhibit any changes on the surface it is possible code itself might be declaring new variables or making new method calls upon modifications, all of those need to be tested and the new test-scenario or spec-file should be committed together with the feature change.

#### Our testing framework(s)

We are using `jasmine` for executing unit tests within `interfaces` and `jest` within `services`. However, while writing the unit test cases, the writing style and testing paradigm do not differ since `jest` is based on `jasmine`.

#### Writing tests

See the [Guide: Writing tests](./guide-Writing-Tests.md)

---

## Releases

See notable changes and the currently release version in the [CHANGELOG](CHANGELOG.md).

### Release Checklist

This is how we create and publish a new release of the 121-platform.
(See [the glossary](#glossary) for definitions of some terms.)

- [ ] Define the date/time of the release. (Notify the dev-team for a code-freeze.)
- [ ] Define what code gets released. ("_Is the current `main`-branch working?_")
- [ ] Define the `version`(-number) for the upcoming release.
- [ ] Update the [CHANGELOG](CHANGELOG.md) with the date + version.
  - [ ] Create a PR with the changes on the changelog.
  - [ ] Merge the changes to main.
- [ ] Make any configuration changes (ENV-variables, etc.) to the staging-service in the Azure Portal.
- [ ] "[Draft a release](https://github.com/global-121/121-platform/releases/new)" on GitHub
  - [ ] For "Choose a tag": Insert the `version` to create a new tag
  - [ ] For "Target": Choose the commit which was created as a result of merging the CHANGELOG changes into main
  - [ ] Set the title of the release to `<version>`.  
         Add a short description and/or link to relevant other documents (only if applicable)
  - [ ] Publish the release on GitHub (as 'latest', not 'pre-release')
  - [ ] Check the deployed release on the staging environment
  - [ ] Make any configuration changes (ENV-variables, etc.) on production-service(s)
  - [ ] Use the [deployment-workflows on GitHub Actions](https://github.com/global-121/121-platform/actions) to deploy to production (for each instance)

### Patch/Hotfix Checklist

This follows a similar process to regular release + deployment, with some small changes.

- Code does not need to be frozen.
- Checkout the `<version>` tag which contains the code that you want to hotfix from.
- Create a new local hotfix branch using that tag as the head (e.g. `hotfix/<v1.x.1>`) and make the changes
- Add the hotfix-release to the [CHANGELOG](CHANGELOG.md)
- Push this branch to the upstream/origin repository.
- Create a new release + tag (see above) selecting the `hotfix` branch as target, and publish it.
- Use the [deployment-workflows on GitHub Actions](https://github.com/global-121/121-platform/actions) to deploy the newly created tag (**not the branch**) to production (for each instance)
- After the hotfix has been released to production, follow standard procedures to merge the hotfix branch into main

**Note:** it is important that you do not rebase the `hotfix` branch on the head of `main` until AFTER you have successfully deployed the hotfix to production. The hotfix branch was created from a "dangling" commit, so this makes the GitHub UI confused when you look at a PR between the newly created `hotfix` branch and `main`, but you can ignore any conflict warnings from GitHub while you release.

---

## Deployment

### Database

If you deploy the 121-platform to a server for the first time it is recommended to setup a separate Postgres database server. The connection to this database can be made by editing the `POSTGRES_*` variables in `services/.env`.

### Interfaces

#### To "test" environment

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_test_*.yml` )

- PR's to the branch `main` are automatically deployed to an individual preview-environment.
- When merged, a separate deployment is done to the test-environment; for that interface only

### To "staging/production" environment(s)

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_staging_*.yml` )

- Created releases are automatically deployed to the staging-environment
- A manual deploy can also be run using the "Run workflow/`workflow_dispatch`" and selecting the preferred release-version `tag`.

### Service(s)

#### To "test" environment

See: (via [GitHub Action(s)](.github/workflows/); i.e. `deploy_test_service.yml` )

- When merged, a separate deployment is done to the test-environment.
- Make sure to update any environment-configuration in the Azure-portal as soon as possible, preferably before the merge & deploy.

### To "staging/production" environment(s)

#### On initial deployment (only)

- [ ] Create the necessary Azure resources
- [ ] Configure the service configurations based on [`.env.example`](./services/.env.example)
- [ ] Create the necessary build/deploy-workflow files
- [ ] Merge these new files into the `main`-branch
- [ ] Build/Deploy the platform via the [GitHub Action(s)](.github/workflows/) by selecting the target release-version `tag`

#### On next deployments

- [ ] Decide on what version to deploy
- [ ] Check for any changes/additions/removals in the [CHANGELOG](CHANGELOG.md)
- [ ] Prepare the environment accordingly (Setting all service-configuration in Azure Portal)
- [ ] Build/Deploy the platform via the [GitHub Action(s)](https://github.com/global-121/121-platform/actions) by selecting the target release-version `tag`

## Glossary

| Term          | Definition (_we_ use)                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `version`     | A 'number' specified in the [`SemVer`](https://semver.org/spec/v2.0.0.html)-format: `1.1.0`                  |
| `tag`         | A specific commit or point-in-time on the git-timeline; named after a version, i.e. `v1.1.0`                 |
| `release`     | A fixed 'state of the code-base', [published on GitHub](https://github.com/global-121/121-platform/releases) |
| `deployment`  | An action performed to get (released) code running on an environment                                         |
| `environment` | A machine that can run code (with specified settings); i.e. a service, or your local machine                 |

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).

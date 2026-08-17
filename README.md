# ZiCi

A Matrix client based on Cinny that attempts to be featureful and intuitive, while remaining Human.

<img align="center" src="https://codeberg.org/avatars/b1fbfb59ba66cab3f869f956e2908abfc622b77d75be153bfdbb36fe5b0ef93b" height="380">

## Getting started
You can access the app at [zici.she-a.eu](https://zici.she-a.eu) which will track each stable update, but the latest updates will always be available to download from [codeberg](https://codeberg.org/HaZi/ZiCi).

## Self-hosting
To host ZiCi on your own, the recommended way is by downloading the release version, and building it using the commands below, and then serving the result from /dist in your preferred method

```sh
npm ci # Installs all dependencies
npm run build # Builds the app in /dist
```


* The default homeservers and explore pages are defined in [`config.json`](config.json).

* You need to set up redirects to serve the assests. Example configurations; [netlify](netlify.toml), [nginx](contrib/nginx/zici.domain.tld.conf), [caddy](contrib/caddy/caddyfile).
    * If you have trouble configuring redirects you can [enable hash routing](config.json#L35), the url in the browser will have a `/#/` between the domain and open channel (ie. `zici.she-a.eu/#/home/` instead of `zici.she-a.eu/home/`) but you won't have to configure your webserver.

* To deploy on subdirectory, you need to rebuild the app after updating the `base` path in [`build.config.ts`](build.config.ts).
    * For example, if you want to deploy on `https://zici.she-a.eu/app`, then set `base: '/app'`.

## Local development
> [!TIP]
> We recommend using a version manager as versions change very quickly. You will likely need to switch between multiple Node.js versions based on the needs of different projects you're working on. [NVM on windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) on Windows and [nvm](https://github.com/nvm-sh/nvm) on Linux/macOS are pretty good choices. Recommended nodejs version is Krypton LTS (v24.13.1).

Execute the following commands to start a development server:
```sh
npm ci # Installs all dependencies
npm start # Serve a development version
```

To build the app:
```sh
npm run build # Compiles the app into the dist/ directory
```
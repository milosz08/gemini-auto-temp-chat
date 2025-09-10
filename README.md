# Gemini auto temporary chat

This extension automatically enables the "temporary chat" feature every time the Gemini page loads. This ensures your
chats are not saved to your history by default. You can easily toggle this automatic behavior on or off with a single
click on the extension's icon in your toolbar.

![](/.github/demo.gif)

## Table of content

* [Supporting browsers](#supporting-browsers)
* [Prepare development environment](#prepare-development-environment)
* [Known issues](#known-issues)
* [Author](#author)
* [License](#license)

## Supporting browsers

- [x] Chrome (and others based on Chromium),
- [x] Firefox,
- [ ] Safari (soon).

## Prepare development environment

1. Clone repo
```bash
$ git clone https://github.com/milosz08/gemini-auto-temp-chat
```

2. Install dependencies
```bash
$ yarn install
```

> [!TIP]
> If you do not have yarn, install via: `npm i -g yarn`.

3. Run development server
```bash
$ yarn run dev
```

4. Load development build from `.output` into browser (as unpacked extension).

## Known issues

- [ ] When a user is not logged in, a redirect from gemini.google.com can cause the extension to activate undesirably on
the landing page. The extension should only activate after the user has successfully logged in and the main chat
interface is loaded.

- [ ] The button added by the extension disappears when the user dynamically resizes the browser window. A page refresh
is required for the button to reappear.

## Author

Created by Miłosz Gilga. If you have any questions about this source code, send message:
[miloszgilga@gmail.com](mailto:miloszgilga@gmail.com).

## License

This application is licensed under the MIT License.

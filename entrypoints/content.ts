import { storage } from '#imports';
import constants from './constants';

// css classes
const FULL_SCREEN_LOADER = 'gem-atc__loader-container';
const LOADER_SPINNER = 'gem-atc__loader-spinner';
const TOGGLE_BUTTON_MAIN_CLASS = 'gem-atc__startup-temp-chat-button';
const ACTIVE_TOGGLE_BUTTON_CLASS = 'gem-atc__startup-temp-chat-button--active';
const HIDDEN_TOGGLE_BUTTON_CLASS = 'gem-atc__startup-temp-chat-button--hidden';
const STARTUP_BUTTON_LINK_CLASS = 'gem-atc__startup-temp-chat-link';

// selectors
const GEMINI_TEMP_BUTTON_SELECTOR = 'button[data-test-id="temp-chat-button"]';
const GEMINI_NEW_CHAT_BUTTON = 'side-nav-action-button[data-test-id="new-chat-button"]';
const GEMINI_SIDE_NAV_HISTORY_CONTAINER = '.sidenav-with-history-container';
const GEMINI_NAV_HAMBURGER_BUTTON = 'button[data-test-id="side-nav-menu-button"]';
const GEMINI_COLLAPSED_CLASS = 'collapsed';

const MOBILE_DESKTOP_KEYPOINT = 960;

const { IS_ALWAYS_START_ON_TEMP_CHAT_KEY } = constants;

const injectStyles = () => {
  const filePath = '/injected-styles.css';
  const styleId = `gatc-style-${filePath.replace(/[^a-z0-9]/gi, '-')}`;
  if (document.getElementById(styleId)) {
    return;
  }
  const linkElement = document.createElement('link');
  linkElement.id = styleId;
  linkElement.rel = 'stylesheet';
  linkElement.type = 'text/css';
  linkElement.href = browser.runtime.getURL(filePath);

  document.head.append(linkElement);
};

const expandNav = async (): Promise<HTMLElement | null> => {
  // we must expand left navbar, because temporary chat button is removed from DOM tree
  const navHamburgerButton = await findElement(GEMINI_NAV_HAMBURGER_BUTTON);

  if (window.innerWidth > MOBILE_DESKTOP_KEYPOINT) {
    const navContainer = await findElement(GEMINI_SIDE_NAV_HISTORY_CONTAINER);
    if (navContainer.classList.contains(GEMINI_COLLAPSED_CLASS)) {
      // expand container only if is collapsed
      navHamburgerButton.click();
    }
    return navContainer;
  }
  // we assume that is no nav container (in mobile version)
  navHamburgerButton.click();
  return null;
};

const listenNavClassChanges = async (
  navContainer: HTMLElement,
  onUpdateState: (expanded: boolean) => void
) => {
  const observer = new MutationObserver((mutationsList: MutationRecord[], _) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') {
        continue;
      }
      const element = mutation.target as HTMLElement;
      if (element.className.includes(GEMINI_COLLAPSED_CLASS)) {
        onUpdateState(false);
      } else {
        setTimeout(() => onUpdateState(true), 200); // add timeout (for nav animation)
      }
    }
  });
  observer.observe(navContainer, {
    attributes: true,
    attributeOldValue: true,
  });
};

const updateToggleButtonContent = (button: HTMLElement, isEnabled: boolean) => {
  button.textContent = `Startup temp chat ${isEnabled ? 'enabled' : 'disabled'}`;
  button.classList = TOGGLE_BUTTON_MAIN_CLASS;
  if (isEnabled) {
    button.classList += ` ${ACTIVE_TOGGLE_BUTTON_CLASS}`;
  }
};

const insertToggleButton = async () => {
  const navContainer = await expandNav();
  const newChatButton = await findElement(GEMINI_NEW_CHAT_BUTTON);
  if (!newChatButton) {
    return;
  }
  // get new chat button parent element (navigation list)
  const navigationList = newChatButton.parentElement;
  if (!navigationList) {
    return;
  }
  const persistedState =
    (await storage.getItem<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY)) || false;

  const toggleButton = document.createElement('button');
  if (navContainer) {
    // we show/hide only on desktop mode (in mobile navigation panel cannot floating)
    await listenNavClassChanges(navContainer, expanded => {
      if (expanded) {
        toggleButton.classList.remove(HIDDEN_TOGGLE_BUTTON_CLASS);
      } else {
        toggleButton.classList.add(HIDDEN_TOGGLE_BUTTON_CLASS);
      }
    });
  }
  updateToggleButtonContent(toggleButton, persistedState);
  navigationList.append(toggleButton);

  const buttonLink = document.createElement('a');
  buttonLink.href = '#';
  buttonLink.className = STARTUP_BUTTON_LINK_CLASS;
  buttonLink.textContent = 'Reload window';
  buttonLink.addEventListener('click', () => window.location.reload());

  let alreadyAdded = false;
  storage.watch<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY, (persistedState, _) => {
    updateToggleButtonContent(toggleButton, persistedState ?? false);
    if (!alreadyAdded) {
      navigationList.append(buttonLink);
      alreadyAdded = true;
    }
  });
  toggleButton.addEventListener('click', async () => {
    const persistedState =
      (await storage.getItem<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY)) || false;
    await storage.setItem<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY, !persistedState);
  });
};

const showFullScreenLoader = () => {
  if (!document.getElementById(FULL_SCREEN_LOADER)) {
    const container = document.createElement('div');
    const spinner = document.createElement('div');

    container.id = FULL_SCREEN_LOADER;
    spinner.className = LOADER_SPINNER;

    container.appendChild(spinner);
    document.body.appendChild(container);
  }
};

const hideFullScreenLoader = () => {
  const loader = document.getElementById(FULL_SCREEN_LOADER);
  loader?.remove();
};

const findElement = (selector: string, timeout = 5_000): Promise<HTMLElement> => {
  return new Promise((res, rej) => {
    let attempts = 0;
    const maxAttempts = timeout / 200;
    const interval = setInterval(() => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element && element.offsetParent !== null) {
        clearInterval(interval);
        res(element);
      }
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        rej(new Error(`Unable to find element in DOM tree: ${selector}!`));
      }
    }, 200);
  });
};

export default defineContentScript({
  matches: ['*://*.gemini.google.com/*'],
  async main() {
    injectStyles();
    showFullScreenLoader();

    await insertToggleButton();
    console.log('Gemini auto temporary chat extension loaded.');

    const alwaysStartOnTempChat =
      (await storage.getItem<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY)) || false;
    try {
      if (alwaysStartOnTempChat) {
        const tempChatButton = await findElement(GEMINI_TEMP_BUTTON_SELECTOR);
        tempChatButton.click();
      }
    } catch (err) {
      window.alert(err);
    }
    hideFullScreenLoader();
  },
});

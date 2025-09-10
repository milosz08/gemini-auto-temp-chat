import { browser, storage } from '#imports';
import constants from '../constants';
import './style.css';

const START_YES = 'Yes, always start on temporary chat';
const START_NO = 'No, use normal chat';

const ACTIVE_CSS_CLASS = 'button__element--active';
const HIDDEN_CSS_CLASS = 'link__element--hidden';

const { IS_ALWAYS_START_ON_TEMP_CHAT_KEY } = constants;

const getStorageItem = async (key: StorageItemKey): Promise<boolean> => {
  return (await storage.getItem<boolean>(key)) || false;
};

const updateElementContent = (
  button: HTMLElement,
  state: boolean,
  activeClassName: string,
  textTrue: string,
  textFalse: string
) => {
  button.textContent = state ? textTrue : textFalse;
  button.classList = 'button__element';
  if (state) {
    button.classList += ` ${activeClassName}`;
  }
};

const onClickButton = async (key: StorageItemKey) => {
  const persistedState = await getStorageItem(key);
  await storage.setItem<boolean>(key, !persistedState);
};

const reloadMotherWindow = async (button: HTMLElement) => {
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab.id) {
    await browser.tabs.reload(activeTab.id);
    button.classList.add(HIDDEN_CSS_CLASS);
  }
};

const onDomContentLoad = async () => {
  const startTempChatButton = document.getElementById('startTempChatButton')!;
  const reloadWindowButton = document.getElementById('reloadWindowButton')!;

  const isAlwaysStartOnTempChat = await getStorageItem(IS_ALWAYS_START_ON_TEMP_CHAT_KEY);

  updateElementContent(
    startTempChatButton,
    isAlwaysStartOnTempChat,
    ACTIVE_CSS_CLASS,
    START_YES,
    START_NO
  );

  storage.watch<boolean>(IS_ALWAYS_START_ON_TEMP_CHAT_KEY, (newValue, _) => {
    console.log(`updated state of: ${IS_ALWAYS_START_ON_TEMP_CHAT_KEY} into value: ${newValue}`);
    reloadWindowButton.classList.remove(HIDDEN_CSS_CLASS);
    updateElementContent(
      startTempChatButton,
      newValue || false,
      ACTIVE_CSS_CLASS,
      START_YES,
      START_NO
    );
  });

  startTempChatButton.addEventListener(
    'click',
    async () => await onClickButton(IS_ALWAYS_START_ON_TEMP_CHAT_KEY)
  );
  reloadWindowButton.addEventListener(
    'click',
    async () => await reloadMotherWindow(reloadWindowButton)
  );
};

document.addEventListener('DOMContentLoaded', onDomContentLoad);

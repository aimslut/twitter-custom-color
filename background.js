
const logoPath = ('M114.9,37.9c0.1,1.1,0.1,2.3,0.1,3.4C115,76,'
  + '88.6,116,40.3,116v0C26,116,12,111.9,0,104.2c2.1,0.2,4.2,0'
  + '.4,6.3,0.4c11.8,0,23.3-4,32.6-11.3c-11.2-0.2-21.1-7.5-24.'
  + '5-18.2c3.9,0.8,8,0.6,11.9-0.5C13.9,72.2,5.1,61.4,5.1,48.9'
  + 'c0-0.1,0-0.2,0-0.3c3.7,2,7.7,3.2,11.9,3.3C5.5,44.1,1.9,28'
  + '.8,8.9,16.8c13.3,16.4,33,26.4,54.1,27.4c-2.1-9.1,0.8-18.7'
  + ',7.6-25.1c10.6-9.9,27.2-9.4,37.2,1.1c5.9-1.2,11.5-3.3,16.'
  + '7-6.4c-2,6.1-6.1,11.2-11.5,14.5c5.2-0.6,10.3-2,15.1-4.1C1'
  + '24.5,29.6,120,34.2,114.9,37.9z');

function updateIcon(color) {
  const canvas = new OffscreenCanvas(128, 128);
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.strokeStyle = 'none';
  context.fillStyle = color;
  context.lineWidth = 0;
  const path = new Path2D(logoPath);
  context.fill(path);
  const imageData = context.getImageData(0, 0, 128, 128);
  chrome.action.setIcon({imageData: imageData});
}


chrome.action.disable();

chrome.runtime.onInstalled.addListener(details => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostEquals: 'twitter.com' }
        }),
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostEquals: 'x.com' }
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()]
    }]);
  });
  chrome.storage.sync.get(['color'], result => {
    if (result.color === undefined) {
      chrome.storage.sync.set({ color: '#1d9bf0' });
      updateIcon('#1d9bf0');
    } else {
      updateIcon(result.color);
    }
  });
});


function rgbStringFromHex(hexColor) {
  const [r, g, b] = hexColor.match(/[A-Za-z0-9]{2}/g).map(
    value => parseInt(value, 16));
  return `${r}, ${g}, ${b}`;
}


function injectStyle(tabId) {

  chrome.storage.sync.get(['color'], result => {
    const customColor = result.color;
    const rgbColor = rgbStringFromHex(customColor);
    
    chrome.scripting.insertCSS({
      css: `:root{--custom:${customColor};--custom-rgb:${rgbColor}}`,
      target: {tabId: tabId}
    });

    chrome.scripting.insertCSS({
      files: ['theme.css'],
      target: {tabId: tabId}
    });

  });
}


// right now I think this is injecting multiple times onto the same page
// maybe don't do that?
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const host = url.hostname;
    if (host === 'twitter.com' || host === 'x.com') {
      injectStyle(tabId);
    }
  }
});


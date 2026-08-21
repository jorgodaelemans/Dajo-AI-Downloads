'use strict';

const APP_ORIGIN = 'https://dajo.db-devs.be';
const APP_ENTRY_URL = `${APP_ORIGIN}/`;

function parsedUrl(value) {
  try {
    return new URL(String(value));
  } catch {
    return null;
  }
}

function isAllowedAppUrl(value) {
  const target = parsedUrl(value);
  return Boolean(target && target.protocol === 'https:' && target.origin === APP_ORIGIN);
}

function isAllowedExternalUrl(value) {
  const target = parsedUrl(value);
  return Boolean(target && (target.protocol === 'https:' || target.protocol === 'mailto:'));
}

module.exports = {
  APP_ENTRY_URL,
  APP_ORIGIN,
  isAllowedAppUrl,
  isAllowedExternalUrl,
};

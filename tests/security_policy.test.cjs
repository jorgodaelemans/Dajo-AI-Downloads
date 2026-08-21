'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  APP_ENTRY_URL,
  APP_ORIGIN,
  isAllowedAppUrl,
  isAllowedExternalUrl,
} = require('../src/security_policy.cjs');

test('public client is pinned to the HTTPS Dajo origin', () => {
  assert.equal(APP_ORIGIN, 'https://dajo.db-devs.be');
  assert.equal(APP_ENTRY_URL, 'https://dajo.db-devs.be/');
  assert.equal(isAllowedAppUrl('https://dajo.db-devs.be/auth.html'), true);
  assert.equal(isAllowedAppUrl('http://dajo.db-devs.be/'), false);
  assert.equal(isAllowedAppUrl('https://dajo.db-devs.be.evil.example/'), false);
  assert.equal(isAllowedAppUrl('file:///C:/DajoAi/dajo_ai_v3/app.py'), false);
});

test('external navigation permits only HTTPS and mail links', () => {
  assert.equal(isAllowedExternalUrl('https://github.com/jorgodaelemans/Dajo-AI-Downloads'), true);
  assert.equal(isAllowedExternalUrl('mailto:dajo.db-devs@telenet.be'), true);
  assert.equal(isAllowedExternalUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedExternalUrl('file:///C:/Windows/System32/calc.exe'), false);
});

test('client source contains no local runtime bootstrap', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.cjs'), 'utf8');
  for (const forbidden of ['python', 'uvicorn', 'child_process', 'execFile(', 'spawn(']) {
    assert.equal(source.includes(forbidden), false, `unexpected private runtime reference: ${forbidden}`);
  }
  assert.equal(/[A-Z]:\\[^'"\r\n]+/i.test(source), false, 'unexpected absolute Windows path');
});

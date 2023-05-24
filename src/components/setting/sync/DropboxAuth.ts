// @ts-nocheck
// TODO: putting dropbox support on waitlist because it needs several node modules like crypto.
// https://github.com/tradle/rn-nodeify#rn-nodeify
// https://github.com/FormidableLabs/react-native-app-auth/blob/main/docs/config-examples/dropbox.md
// https://github.com/lovegaoshi/azusa-player/blob/nox-player/src/utils/dropboxauth.js
import { DropboxAuth, Dropbox as _Dropbox } from 'dropbox';
import { authorize } from 'react-native-app-auth';
import { DROPBOX_KEY, DROPBOX_SECRET } from '@env';
import { logger } from '../../../utils/Logger';

const DEFAULT_FILE_NAME = 'nox.noxBackup';
const DEFAULT_FILE_PATH = `/${DEFAULT_FILE_NAME}`;

const config = {
  clientId: DROPBOX_KEY,
  clientSecret: DROPBOX_SECRET,
  // change this in android/app/build.gradle
  redirectUrl: 'com.noxplayer://oauth',
  scopes: [],
  serviceConfiguration: {
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
    tokenEndpoint: `https://www.dropbox.com/oauth2/token`,
  },
};

/**
 * dbx is the dropbox API caller. I initialize it without
 * any access token; when a new token is retrieved via dba,
 * set dbx to a new Drobox object with the correct accesstoken.
 */
let dbx = new _Dropbox({
  accessToken: '',
});

/**
 * this method attempts to login dropbox. the accesstoken can be
 * further processed in the callback function as a part of the
 * returned url from chrome.identity.launchWebAuthFlow.
 * @param {function} callback function that process the returned url after oauth2.
 * @param {function} errorHandling
 */
export const getAuth = async (
  callback = () => checkAuthentication().then(console.log),
  errorHandling = console.error
) => {
  console.log(authorize, config);
  const authState = await authorize(config);
  console.log(authState);
  const dropboxUID = authState.tokenAdditionalParameters?.account_id;
  if (dropboxUID) {
    dbx = new _Dropbox({
      accessToken: dropboxUID,
    });
    callback();
  } else {
    errorHandling('no response url returned. auth aborted by user.');
  }
};

/**
 * lists the noxplayer setting in dropbox.
 * returns either null if nothing is found, or the path_display of it
 * that can be used to retrieve content.
 * @param {string} query
 * @returns {string}
 */

const find = async (query = DEFAULT_FILE_NAME) => {
  const data = await dbx.filesSearchV2({
    query,
    options: {
      order_by: 'last_modified_time',
    },
  });
  try {
    return data.result.matches[0].metadata.metadata.path_display;
  } catch (e) {
    console.warn(`no ${query} found.`);
    return null;
  }
};

/**
 * upload the noxplayer setting file to dropbox, with the mode
 * overwrite. As a sync function there is no need to keep multiple
 * versions.
 * @param {Object} content
 * @param {string} fpath
 * @returns
 */
const upload = async (content: Blob, fpath = DEFAULT_FILE_PATH) => {
  return await dbx.filesUpload({
    path: fpath,
    mode: 'overwrite',
    contents: content,
  });
};
// upload({'new': 'content'}).then(console.log)

/**
 * download the noxplayer setting from dropbox.
 * returns the parsed JSON object or null if not found.
 * @param {string} fpath
 * @returns playerSetting object, or null
 */
const download = async (fpath = DEFAULT_FILE_PATH) => {
  if (fpath === null) {
    return null;
  }
  const blob = (
    await dbx.filesDownload({ path: fpath })
  ).result.fileBlob.arrayBuffer();
  return new Uint8Array(await blob);
};

/**
 * wraps up find noxplayer setting and download in one function;
 * returns the JSON object of settting or null if not found.
 * @returns playerSetting object, or null
 */
export const noxRestore = async () => {
  const noxFile = await find();
  return await download(noxFile);
};

/**
 * wraps up upload noxplayer setting. returns the response
 * if successful.
 * @param {Object} content
 * @returns
 */
export const noxBackup = async (content: Blob) => {
  return await upload(content);
};

const checkAuthentication = async () => {
  try {
    await dbx.usersGetCurrentAccount();
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Check if dropbox token is valid by performing a simple
 * userGetCurrentAccount API request. if fails, acquire the token
 * again via getAuth. afterwards, the callback function is chained.
 * put noxRestore/noxBackup as callback in this function to ensure
 * user is logged in via dropbox before these operations.
 * @param {function} callback
 * @param {function} errorCallback
 * @returns
 */
export const loginDropbox = async (
  callback = () => undefined,
  errorCallback = console.error
) => {
  try {
    if (!(await checkAuthentication())) {
      console.debug('dropbox token expired, need to log in');
      await getAuth(callback, errorCallback);
    } else {
      callback();
    }
    return true;
  } catch (e) {
    errorCallback(e);
    return false;
  }
};

// uploadNox({'timestmap': new Date().toString()});
// downloadNox().then(console.log);
// authenticate().then(console.log)

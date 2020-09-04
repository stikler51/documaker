import * as t from '../types';

export const setLang = (lang) => {
  return {
    type: t.CHANGE_LANG,
    payload: lang
  }
}
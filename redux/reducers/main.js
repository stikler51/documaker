import * as t from '../types';

const initialState = {
  lang: "ru"
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case t.CHANGE_LANG:
      return {
        ...state,
        lang: action.payload,
      }
    default:
      return {...state}
  }
}

export default reducer;
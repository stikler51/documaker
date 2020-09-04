import {createStore} from "redux";
import main from '../redux/reducers/main';

const store = createStore(main);
export default store;
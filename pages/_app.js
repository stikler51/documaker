import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/styles.scss";
import 'react-bootstrap-typeahead/css/Typeahead.css';

import React from "react";
import App from 'next/app';
import { Provider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import store from '../redux/store';


class MyApp extends App {
  static async getInitialProps({ Component, ctx }) {
    const appProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};
    return {
      appProps: appProps
    }
  }

  render() {
    const { Component, appProps } = this.props;
    return <Provider store={store}>
      <Component {...appProps} />
    </Provider>
  }
}

const makeStore = () => store;

export default withRedux(makeStore)(MyApp);

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

// export default MyApp;
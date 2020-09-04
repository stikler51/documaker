import React from "react";
import cookies from 'next-cookies';
import Link from 'next/link';
import Layout from "../components/Layout";
import {setLang} from "../redux/actions/main";
import {connect} from "react-redux";
import Loading from "../components/Loading";
import styles from "../styles/staticPage.module.scss";
import Head from "../components/head";

class Terms extends React.Component {
  constructor(props) {
    super(props);

    this.langHandler = this.langHandler.bind(this);

    this.state = {
      lang: props.language,
      globalLoading: false,
      title: props.title,
      body: props.body
    }
  }

  async langHandler(val) {
    document.cookie = `lang=${val}`;

    this.setState({
      globalLoading: true,
    });

    const page = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${val}&id=9`);
    let pageJson = await page.json();

    this.setState({
      lang: val,
      globalLoading: false,
      title: pageJson[0].title,
      body: pageJson[0].body
    })
  }

  render() {
    if (this.state.globalLoading) {
      return <Loading/>
    } else {
      return <Layout changeLang={this.langHandler} lang={this.state.lang}>
        <Head
          title={this.state.title}
        />
          <div className={styles.formBlock}>
            <h1>{this.state.title}</h1>

            <div className="text-body" dangerouslySetInnerHTML={{__html: this.state.body}}>

            </div>
          </div>

      </Layout>
    }
  }
}

Terms.getInitialProps = async (props) => {
  let lang = cookies(props).lang || props.store.getState().lang;

  //http://sandbox.webbro.pro/api/static_pages?lang=ru&id=7

  const page = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${lang}&id=9`);
  let pageJson = await page.json();

  return {language: lang, title: pageJson[0].title, body: pageJson[0].body}
}

const mapStateToProps = state => ({
  lang: state.lang
});

const mapDispatchToProps = {
  setLang: setLang
}

export default connect(mapStateToProps, mapDispatchToProps)(Terms);
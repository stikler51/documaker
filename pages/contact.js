import React from "react";
import cookies from 'next-cookies';
import Link from 'next/link';
import Layout from "../components/Layout";
import {setLang} from "../redux/actions/main";
import {connect} from "react-redux";
import Loading from "../components/Loading";
import styles from "../styles/staticPage.module.scss";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Head from "../components/head";

class Contact extends React.Component {
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

    const page = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${val}&id=8`);
    let pageJson = await page.json();
    // this.props.setLang(val);

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
        <Row>
          <Col md={6}>
            <div className={styles.formBlock}>
              <h1>{this.state.title}</h1>

              <div className="text-body" dangerouslySetInnerHTML={{__html: this.state.body}}>
              </div>
            </div>
          </Col>

          <Col md={6}>

            <div className={styles.formBlock}>
              <iframe src={`//sandbox.webbro.pro${this.state.lang == 'ru' ? '' : '/' + this.state.lang}/webform/contact_us/share`} title="Contact Us | DocuMaker"
                      className="webform-share-iframe" frameBorder="0"
                      allowTransparency="true" allowFullScreen="true"
                      style={{width:'100%',height:'600px',border:'none'}}></iframe>
            </div>
          </Col>
        </Row>


      </Layout>
    }
  }
}

Contact.getInitialProps = async (props) => {
  let lang = cookies(props).lang || props.store.getState().lang;

  //http://sandbox.webbro.pro/api/static_pages?lang=ru&id=7

  const page = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${lang}&id=8`);
  let pageJson = await page.json();


  return {language: lang, title: pageJson[0].title, body: pageJson[0].body}
}

const mapStateToProps = state => ({
  lang: state.lang
});

const mapDispatchToProps = {
  setLang: setLang
}

export default connect(mapStateToProps, mapDispatchToProps)(Contact);
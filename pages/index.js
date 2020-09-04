import React from "react";
import cookies from 'next-cookies';
import Link from 'next/link';
import Layout from "../components/Layout";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Spinner from "react-bootstrap/Spinner";
import {connect} from 'react-redux';
import {setLang} from '../redux/actions/main';
import Loading from "../components/Loading";
import Shield from "../static/shield.svg";
import styles from "../styles/mainPage.module.scss";
import SvgWrapper from "../components/SvgWrapper";
import Form from "react-bootstrap/Form";
import CloseIcon from "../static/close.svg";
import Head from "../components/head";

class MainPage extends React.Component {
  constructor(props) {
    super(props);

    this.langHandler = this.langHandler.bind(this);

    this.state = {
      mainCatId: 1,
      subCatId: props.subCategories.length ? props.subCategories[0].tid : '',
      subCategories: props.subCategories,
      mainCategories: props.mainCategories,
      docs: props.docs,
      loadingM: false,
      loadingS: false,
      lang: props.language,
      globalLoading: false,
      activeDoc: {
        id: '',
        slug: '',
        description: ''
      },
      isMobile: false,
      savedTemplates: [],
      whiteBlock: props.whiteBlock,
      greenBlock: props.greenBlock,
    }
  }

  componentDidMount() {
    let documendibass_savedTemplates = window.localStorage.getItem('documendibass_savedTemplates');
    if (!documendibass_savedTemplates) {
      documendibass_savedTemplates = [];
    } else {
      documendibass_savedTemplates = JSON.parse(documendibass_savedTemplates);
    }

    this.setState({
      savedTemplates: documendibass_savedTemplates
    })



    if (window.innerWidth < 768) {
      this.setState({
        isMobile: true,
        activeDoc: {
          id: this.state.docs[0].nid,
          slug: this.state.docs[0].slug,
          description: this.state.docs[0].body
        }
      })
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        this.setState({
          isMobile: true
        })
      } else {
        this.setState({
          isMobile: false
        })
      }
    });


  }

  async langHandler(val) {
    document.cookie = `lang=${val}`;

    this.setState({
      globalLoading: true
    });

    const mainCategories = await fetch(`http://sandbox.webbro.pro/api/categories?lang=${val}`);
    let mCat = await mainCategories.json();

    const subCategories = await fetch(`http://sandbox.webbro.pro/api/subcategories?lang=${val}&parent_id=${this.state.mainCatId}`);
    let sCat = await subCategories.json();

    const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${this.state.subCatId}&lang=${val}`)
    const initDocs = await docs.json();

    const pageTitleDescription = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${val}&id=10`);
    let pageTitleDescriptionJson = await pageTitleDescription.json();

    const greenBlock = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${val}&id=11`);
    let greenBlockJson = await greenBlock.json();

    this.props.setLang(val);

    this.setState({
      mainCategories: mCat,
      subCategories: sCat,
      docs: initDocs,
      lang: val,
      globalLoading: false,
      greenBlock: greenBlockJson[0].body,
      whiteBlock: {
        title: pageTitleDescriptionJson[0].title,
        body: pageTitleDescriptionJson[0].body
      }
    })
  }

  render() {
    if (this.state.globalLoading) {
      return <Loading />
    } else {
      return (
        <Layout changeLang={this.langHandler} lang={this.state.lang}>
          <Head
            title={this.state.whiteBlock.title}
            description={this.state.whiteBlock.body}
          />
          <Row className={styles.topLineWrapper}>
            <Col md={8} className={styles.helperWrapper}>
              <div className={styles.formBlock}>
                <h1 dangerouslySetInnerHTML={{__html: this.state.whiteBlock.title }}></h1>
                <div dangerouslySetInnerHTML={{__html: this.state.whiteBlock.body }}></div>
              </div>
            </Col>
            <Col md={4}>
              <div className={styles.greenBlock}>
                <Shield />
                <div dangerouslySetInnerHTML={{__html: this.state.greenBlock}}></div>
              </div>
            </Col>
          </Row>

          <Row className={styles.tabsWrapper}>
            {this.state.isMobile ? <Col sm={12} className={styles.mobileDocumentSelector}>
                <Form.Control
                  as="select"
                  onChange={async (e) => {
                    let k = e.target.value;

                    this.setState({
                      mainCatId: k,
                      loadingM: true
                    });

                    if (k !== 'saved') {
                      const subCategories = await fetch(`http://sandbox.webbro.pro/api/subcategories?parent_id=${k}&lang=${this.state.lang}`);
                      let sCat = await subCategories.json();
                      let sCatId = '';

                      let initDocs = []

                      if (sCat.length) {
                        sCatId = sCat[0].tid;
                        const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${sCatId}&lang=${this.state.lang}`)
                        initDocs = await docs.json();
                      }

                      this.setState({
                        subCategories: sCat,
                        subCatId: sCatId || '',
                        docs: initDocs,
                        loadingM: false,
                        activeDoc: {
                          id: initDocs[0].nid,
                          slug: initDocs[0].slug,
                          description: initDocs[0].body
                        }
                      })
                    }


                  }}
                >
                  {this.state.mainCategories.map((cat) => {
                    return <option key={cat.tid} value={cat.tid}>{cat.name}</option>
                  })}
                  <option value="saved">{this.state.lang === 'ru' ? 'Мои шаблоны'
                    : this.state.lang === 'en' ? 'My Templates' : 'Minu mallid'}
                  </option>
                </Form.Control>

                <p className="step"><span>1.</span>{this.state.lang == 'ru' ? "Выберите категорию документов:" : this.state.lang == 'en' ? 'Select a category of documents:' : 'Valige dokumentide kategooria:'}</p>

                <Form.Control
                  as="select"
                  onChange={async (e) => {
                    let k = e.target.value;
                    this.setState({
                      subCatId: k,
                      loadingS: true
                    });
                    const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${k}&lang=${this.state.lang}`)
                    const initDocs = await docs.json();
                    this.setState({
                      docs: initDocs,
                      loadingS: false,
                      activeDoc: {
                        id: initDocs[0].nid,
                        slug: initDocs[0].slug,
                        description: initDocs[0].body
                      }
                    })

                  }}
                >

                  {this.state.subCategories.map(sCat => {
                    return <option key={sCat.tid} value={sCat.tid}>{`${sCat.name} (${sCat.count})`}</option>
                  })
                  }
                </Form.Control>

                <p className="step"><span>2.</span>{this.state.lang == 'ru' ? "Выберите шаблон документа:" : this.state.lang == 'en' ? 'Select a document template:' : 'Valige dokumendi mall:'}</p>

                <Form.Control
                  as="select"
                  onChange={async (e) => {
                    let data = e.target.value;
                    let dataObj = JSON.parse(data)
                    this.setState({
                      activeDoc: {
                        id: +dataObj.id,
                        slug: dataObj.slug,
                        description: dataObj.body
                      }
                    })
                  }}
                >
                  {this.state.docs.map((doc) => {
                    return <option key={doc.nid}
                                   value={`{"id": "${doc.nid}", "body": "${doc.body}", "slug": "${doc.slug}"}`}
                    >
                      {doc.title}</option>
                  })}
                </Form.Control>

                <div className={styles.docDescription}
                     dangerouslySetInnerHTML={{__html: this.state.activeDoc.description}}/>

                <div className={styles.createDocBtnWrapper}>
                  <Link
                    href="/[document]"
                    as={`/${this.state.activeDoc.slug}`}
                  >
                    <a className={this.state.activeDoc.slug ? styles.createDocBtn : styles.createDocBtnDisabled}>
                      {this.state.lang == 'ru' ? "Создать документ " : this.state.lang == 'en' ? 'Create document' : 'Loo dokument'} <svg width="8" height="13" viewBox="0 0 8 13" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M0.732086 10.8988L5.12125 6.5L0.732086 2.10125L2.08334 0.75L7.83334 6.5L2.08334 12.25L0.732086 10.8988Z"
                        fill="white"/>
                    </svg>
                    </a>
                  </Link>
                </div>

              </Col>
              : <Col sm={12} className="document-selector">
                <Tabs defaultActiveKey="1"
                      className="top-level-tabs"
                      activeKey={this.state.mainCatId}
                      onSelect={async (k) => {
                        this.setState({
                          mainCatId: k,
                          loadingM: true
                        });

                        if (k !== 'saved') {
                          const subCategories = await fetch(`http://sandbox.webbro.pro/api/subcategories?parent_id=${k}&lang=${this.state.lang}`);
                          let sCat = await subCategories.json();
                          let sCatId = '';

                          let initDocs = []

                          if (sCat.length) {
                            sCatId = sCat[0].tid;
                            const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${sCatId}&lang=${this.state.lang}`)
                            initDocs = await docs.json();
                          }

                          this.setState({
                            subCategories: sCat,
                            subCatId: sCatId || '',
                            docs: initDocs,
                            loadingM: false,
                            activeDoc: {
                              id: '',
                              slug: '',
                              description: ''
                            }
                          })
                        } else {
                          this.setState({
                            activeDoc: {
                              id: '',
                              slug: '',
                              description: ''
                            }
                          })
                        }
                      }}
                >
                  {this.state.mainCategories.map(cat => {
                    return <Tab key={cat.tid} eventKey={cat.tid} title={cat.name}>
                      <p className="step"><span>1.</span>{this.state.lang == 'ru' ? "Выберите категорию документов:" : this.state.lang == 'en' ? 'Select a category of documents:' : 'Valige dokumentide kategooria:'}</p>
                      {this.state.loadingM ?
                        <div className='spinner-wrapper'><Spinner variant='primary' size='lg' animation="border"/>
                        </div> :
                        <Tabs activeKey={this.state.subCatId}
                              className="sub-level-tabs"
                              onSelect={async (k) => {
                                this.setState({
                                  subCatId: k,
                                  loadingS: true
                                });
                                const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${k}&lang=${this.state.lang}`)
                                const initDocs = await docs.json();
                                this.setState({
                                  docs: initDocs,
                                  loadingS: false,
                                  activeDoc: {
                                    id: '',
                                    slug: '',
                                    description: ''
                                  }
                                })


                              }}
                        >
                          {this.state.subCategories.map(sCat => {
                            return <Tab key={sCat.tid} eventKey={sCat.tid}
                                        title={<SvgWrapper icon={sCat.icon} name={`${sCat.name} (${sCat.count})`}/>}>
                              {this.state.loadingS ?
                                <div className='spinner-wrapper'>
                                  <Spinner variant='primary' size='lg'
                                           animation="border"/>
                                </div> :
                                <div>
                                  <p className="step"><span>2.</span>{this.state.lang == 'ru' ? "Выберите шаблон документа:" : this.state.lang == 'en' ? 'Select a document template:' : 'Valige dokumendi mall:'}</p>
                                  <div className={styles.documentBtnWrapper}>
                                    {this.state.docs.map((doc) => {
                                      return <button title={doc.title}
                                                     key={doc.nid}
                                                     className={this.state.activeDoc.id === doc.nid ? styles.documentBtnActive : styles.documentBtn}
                                                     documentlink={`/${doc.slug}`}
                                                     onClick={(e) => {
                                                       this.setState({
                                                         activeDoc: {
                                                           id: doc.nid,
                                                           slug: doc.slug,
                                                           description: doc.body
                                                         }
                                                       })
                                                     }}
                                      >
                                        {doc.title}
                                      </button>
                                    })}
                                  </div>
                                </div>
                              }
                              <div className={styles.docDescription}
                                   dangerouslySetInnerHTML={{__html: this.state.activeDoc.description}}/>
                            </Tab>
                          })}
                        </Tabs>}

                      <div className={styles.createDocBtnWrapper}>
                        <Link
                          href="/[document]"
                          as={`/${this.state.activeDoc.slug}`}
                        >
                          <a className={this.state.activeDoc.slug ? styles.createDocBtn : styles.createDocBtnDisabled}>
                            {this.state.lang == 'ru' ? "Создать документ " : this.state.lang == 'en' ? 'Create document' : 'Loo dokument'}
                            <svg width="8" height="13" viewBox="0 0 8 13" fill="none"
                                                  xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M0.732086 10.8988L5.12125 6.5L0.732086 2.10125L2.08334 0.75L7.83334 6.5L2.08334 12.25L0.732086 10.8988Z"
                              fill="white"/>
                          </svg>
                          </a>
                        </Link>
                      </div>
                    </Tab>
                  })}
                  <Tab
                    eventKey="saved"
                    title={this.state.lang === 'ru' ? 'Мои шаблоны'
                      : this.state.lang === 'en' ? 'My Templates' : 'Minu mallid'}>
                    <h2>{this.state.lang === 'ru' ? 'Мои шаблоны'
                      : this.state.lang === 'en' ? 'My Templates' : 'Minu mallid'}</h2>
                    <div className={styles.documentBtnWrapper}>
                    {this.state.savedTemplates.map((doc) => {
                      return <button title={doc.title}
                                     key={doc.nid}
                                     className={this.state.activeDoc.id === doc.nid ? styles.documentBtnSavedActive : styles.documentBtnSaved}
                                     documentlink={`/${doc.slug}?saved=${doc.nid}`}
                                     onClick={(e) => {
                                       this.setState({
                                         activeDoc: {
                                           id: doc.nid,
                                           slug: `/${doc.slug}?saved=${doc.nid}`,
                                           description: doc.body
                                         }
                                       })
                                     }}
                      >
                        {doc.title}
                        <CloseIcon onClick={(e) => {
                          e.stopPropagation();
                          let documendibass_savedTemplates = window.localStorage.getItem('documendibass_savedTemplates');
                          documendibass_savedTemplates = JSON.parse(documendibass_savedTemplates);

                          let newDocumendibass_savedTemplates = documendibass_savedTemplates.filter(template => {
                            if (template.nid !== doc.nid) {
                              return template
                            }
                          });

                          window.localStorage.setItem('documendibass_savedTemplates', JSON.stringify(newDocumendibass_savedTemplates));

                          this.setState({
                            savedTemplates: newDocumendibass_savedTemplates,
                            activeDoc: {
                              id: '',
                              slug: '',
                              description:''
                            }
                          })
                        }} />
                      </button>
                    })}
                    </div>
                    <div className={styles.createDocBtnWrapper}>
                      <Link
                        href="/[document]"
                        as={`${this.state.activeDoc.slug}`}
                      >
                        <a className={this.state.activeDoc.slug ? styles.createDocBtn : styles.createDocBtnDisabled}>
                          {this.state.lang == 'ru' ? "Создать документ " : this.state.lang == 'en' ? 'Create document' : 'Loo dokument'}
                          <svg width="8" height="13" viewBox="0 0 8 13" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M0.732086 10.8988L5.12125 6.5L0.732086 2.10125L2.08334 0.75L7.83334 6.5L2.08334 12.25L0.732086 10.8988Z"
                            fill="white"/>
                        </svg>
                        </a>
                      </Link>
                    </div>
                  </Tab>
                </Tabs>
              </Col>}
          </Row>
        </Layout>
      );
    }


  }
}


MainPage.getInitialProps = async (props) => {
  let lang = cookies(props).lang || props.store.getState().lang;

  // Fetch data from external API
  const mainCategories = await fetch(`http://sandbox.webbro.pro/api/categories?lang=${lang}`);
  let mCat = await mainCategories.json();

  // console.log(1, mCat);

  const subCategories = await fetch(`http://sandbox.webbro.pro/api/subcategories?lang=${lang}&parent_id=${mCat[0].tid}`);
  let sCat = await subCategories.json();

  const pageTitleDescription = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${lang}&id=10`);
  let pageTitleDescriptionJson = await pageTitleDescription.json();

  const greenBlock = await fetch(`http://sandbox.webbro.pro/api/static_pages?lang=${lang}&id=11`);
  let greenBlockJson = await greenBlock.json();

  let initDocs = [];
  let sCatId = '';

  if (sCat.length) {
    const docs = await fetch(`http://sandbox.webbro.pro/api/short_docs?cat_id=${sCat[0].tid}&lang=${lang}`)
    initDocs = await docs.json();

    sCatId = sCat[0].tid;
  }

  return {
    mainCategories: mCat,
    subCategories: sCat,
    docs: initDocs,
    language: lang,
    subCatId: sCatId,
    whiteBlock: {
      title: pageTitleDescriptionJson[0].title,
      body: pageTitleDescriptionJson[0].body
    },
    greenBlock: greenBlockJson[0].body
  }
}

const mapStateToProps = state => ({
  lang: state.lang
});

const mapDispatchToProps = {
  setLang: setLang
}

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
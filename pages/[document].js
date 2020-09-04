import React from "react";
import DocForm from "../components/DocForm";
import Layout from "../components/Layout";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import DocumentPreview from "../components/DocumentPreview";
import {renderToStaticMarkup} from 'react-dom/server';
import base64ArrayBuffer from "../lib/base64Buffer";
import Progress from "../components/Progress";
import Spinner from 'react-bootstrap/Spinner';
import Loading from "../components/Loading";
import cookies from 'next-cookies';
import {connect} from 'react-redux';
import {setLang} from '../redux/actions/main';
import Form from "react-bootstrap/Form";
import Link from "next/link";
import PreviewIcon from '../static/preview.svg';
import { Beforeunload } from 'react-beforeunload';
import Head from "../components/head";




class DocumentPage extends React.Component {
  constructor(props) {
    super(props);
    this.replaceTokens = this.replaceTokens.bind(this);
    this.langHandler = this.langHandler.bind(this);
    this.openSidebar = this.openSidebar.bind(this);

    this.state = {
      data: props.data,
      objSchema: props.objSchema,
      showModalPreview: false,
      showModalSaveTemplate: false,
      pdfBuffer: '',
      previewLoading: false,
      downloadLoading: false,
      globalLoading: false,
      lang: props.language,
      error: '',
      userIsAgree: false,
      isMobile: false,
      visFields: {},
      patternName: ''
    }
  }

  async componentDidMount() {
    if (this.props.saved) {
      let savedString = window.localStorage.getItem('documendibass_savedTemplates');
      let savedTemplates = JSON.parse(savedString);
      let template;

      await savedTemplates.map(temp => {
        if (temp.nid == this.props.saved) {
          template = temp;
          return temp;
        }
      });

      this.setState({
        patternName: template.title,
        originalPatternName: template.title
      })
    }

    if (window.innerWidth < 768) {
      this.setState({
        isMobile: true
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

  replaceTokens(tokens) {
    // console.log(tokens);
    let initialText = this.state.data[0].doc;

    for (let key in tokens) {
      if (tokens[key].length) {
        let str1 = `{{${key}}}`
        var re = new RegExp(str1, "g");
        initialText = initialText.replace(re, tokens[key]);
      } else {
        if (typeof tokens[key] === 'object') {
          let htmlStr = '<ul>';
          for (let k in tokens[key]) {
            htmlStr += `<li>${tokens[key][k]}</li>`
          }
          htmlStr += '</ul>';

          let str1 = `{{${key}}}`
          var re = new RegExp(str1, "g");
          initialText = initialText.replace(re, htmlStr);
        }
      }
    }

    let str1 = `\{\{.*?\}\}`
    var re = new RegExp(str1, "g");
    initialText = initialText.replace(re, '');


    let visAndReq = [];

    this.state.objSchema.fieldBlocks.map(block => {
      block.fields.map((field) => {
        if (field.required) {
          if (field.id in tokens) {
            visAndReq[field.id] = tokens[field.id];
          }
        }
      })
    })

    this.setState({
      doc: initialText,
      visFields: tokens,
      visAndReq: visAndReq
    })

  }

  async langHandler(val) {
    document.cookie = `lang=${val}`;

    this.props.setLang(val);

    this.setState({
      globalLoading: true
    })

    const res = await fetch(`http://sandbox.webbro.pro/api/all_docs?slug=${this.props.slug}&lang=${val}`)
    const data = await res.json();

    if (!data.length) {
      this.setState({
        error: 'Перевода документа на этом языке не существует',
        globalLoading: false,
        lang: val
      })
      return;
    }

    let schema = data[0].schema;
    const objSchema = JSON.parse(schema);


    this.setState({
      error: '',
      data: data,
      objSchema: objSchema,
      globalLoading: false,
      lang: val
    })
  }

  openSidebar() {
    document.body.classList.toggle('overflow');
    document.body.querySelector('.sidebar').classList.toggle('opened');
  }

  render() {
    if (this.state.globalLoading) {
      return <Loading/>
    } else {
      return (
        <Layout className="document-page" error={this.state.error} changeLang={this.langHandler} lang={this.state.lang}>
          {this.state.loading ? 'Loading' :
            <>
              <Head
                title={this.state.data[0].title}
                description={this.state.data[0].body}
              />
              <Beforeunload onBeforeunload={() => {
                return "You'll lose your data!";
              }} />
              <Row>
                <Col md={8}>
                  <DocForm changeHandler={this.replaceTokens}
                           schema={this.state.objSchema}
                           title={this.state.data[0].title}
                           body={this.state.data[0].body}
                           js={this.state.data[0].js}
                           saved={this.props.saved}
                  />
                </Col>

                <Col className="sidebar" md={4}>

                  <Progress lang={this.state.lang} allFields={this.state.visAndReq} btnHandler={this.openSidebar}/>
                  {/*<div className="doc" dangerouslySetInnerHTML={{__html: this.state.doc}}></div>*/}
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <Button
                      className="roundBtn"
                      disabled={!this.state.userIsAgree}
                      onClick={async () => {
                        const urlToFile = (url, filename) => {
                          return fetch(url)
                            .then((res) => {
                              return res.arrayBuffer();
                            })
                            .then((buf) => {
                              return new File([buf], filename);
                            });
                        };

                        this.setState({
                          downloadLoading: true
                        })

                        let html = await renderToStaticMarkup(<div
                          dangerouslySetInnerHTML={{__html: this.state.doc}}></div>);
                        let buffer = await fetch('/api/pdf', {
                          method: 'POST',
                          body: html,
                        });
                        let answerJson = await buffer.arrayBuffer();
                        let arrayBuffer = base64ArrayBuffer(answerJson);
                        const fileUrl = `data:application/octet-stream;base64,${arrayBuffer}`;
                        urlToFile(fileUrl, this.state.data[0].title).then((file) => {
                          const blob = new Blob([file], {type: 'application/octet-stream'});
                          const blobURL = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobURL;
                          link.setAttribute('download', `${this.state.data[0].title}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        });

                        this.setState({
                          downloadLoading: false
                        })

                      }}
                    >
                      {this.state.lang == 'ru' ? "Скачать PDF" : this.state.lang == 'en' ? 'Download PDF' : 'Laadige alla PDF'}
                      {this.state.downloadLoading ? <Spinner animation="border" size="sm" variant="light"/> : ''}
                    </Button>

                    <Button
                      disabled={Object.keys(this.state.visFields).length ? false : true}
                      onClick={() => this.setState({showModalSaveTemplate: true})}
                      className="roundBtn bordered">
                      {this.state.lang == 'ru' ? "Сохранить" : this.state.lang == 'en' ? 'Save' : 'Salvesta'}
                    </Button>
                  </div>

                  <Form.Check
                    type="checkbox"
                    id='agree'
                    className="agree"
                    label={
                      this.state.lang == 'ru' ? <p>Пользователь ознакомлен и согласен с <Link href="/terms" as="terms"><a target="_blank">условиями использования сервиса</a></Link></p>
                        : this.state.lang == 'en' ? <p>The user is familiar with and agrees with <Link href="/terms" as="terms"><a target="_blank">the terms of use of the service</a></Link></p>
                        : <p>Kasutaja tunneb teenuse <Link href="/terms" as="terms"><a target="_blank">kasutamistingimusi ja on nendega nõus</a></Link></p>}

                    onChange={(e) => {
                      this.setState({
                        userIsAgree: e.target.checked
                      })
                    }}
                  >
                  </Form.Check>

                  {/*<div className="doc">*/}
                  {/*  <p>Вы можете отправить составленный документ на проверку. Наш юрист проверит заполненный документ,*/}
                  {/*    убедится в его корректном оформлении и проконсультирует Вас по вопросу его применения.</p>*/}
                  {/*  <Button variant="success" className="roundBtn green">Отправить на проверку</Button>*/}
                  {/*</div>*/}

                  <Button className="preview-btn"
                          onClick={async () => {
                            this.setState({
                              previewLoading: true
                            })
                            let html = await renderToStaticMarkup(<div
                              dangerouslySetInnerHTML={{__html: this.state.doc}}></div>);
                            let buffer = await fetch('/api/pdf', {
                              method: 'POST',
                              body: html,
                            });
                            let answerJson = await buffer.arrayBuffer();
                            let b = base64ArrayBuffer(answerJson);
                            this.setState({
                              showModalPreview: true,
                              pdfBuffer: b,
                              previewLoading: false
                            })
                          }}>
                    {this.state.lang == 'ru' ? "Предпросмотр" : this.state.lang == 'en' ? 'Preview' : 'Eelvaade'}
                    {this.state.previewLoading ? <Spinner animation="border" size="sm" variant="light"/> :
                      <PreviewIcon/>}
                  </Button>

                </Col>
              </Row>

              <Modal
                show={this.state.showModalPreview}
                onHide={() => this.setState({showModalPreview: false})}
                className="previewModal"
                // aria-labelledby="example-modal-sizes-title-lg"
                centered={this.state.isMobile ? false : true}
              >
                <Modal.Header closeButton>
                  <Modal.Title>
                    {this.state.lang == 'ru' ? "Предпросмотр документа" : this.state.lang == 'en' ? 'Document preview' : 'Dokumendi eelvaade'}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <DocumentPreview isMobile={this.state.isMobile} file={this.state.pdfBuffer}/>
                </Modal.Body>
              </Modal>

              <Modal
                show={this.state.showModalSaveTemplate}
                onHide={() => this.setState({showModalSaveTemplate: false})}
                size="lg"
                className="saveModal"
                // aria-labelledby="example-modal-sizes-title-lg"
                centered={this.state.isMobile ? false : true}
              >
                <Modal.Header closeButton>
                  <Modal.Title>
                    {this.state.lang == 'ru' ? "Сохранить в «Мои шаблоны»" : this.state.lang == 'en' ? 'Save to My Templates' : 'Salvesta kausta Minu mallid'}
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {this.state.lang == 'ru' ? <p>Вы можете сохранить выбранный шаблон в списке «Мои шаблоны». Данные о сохраненных шаблонах
                    записываются в файл cookies вашего браузера. При удалении cookies в вашем браузере, ваш список
                    сохраненных шаблонов также будет удален.</p>
                    : this.state.lang == 'en' ? <p>
                        You can save the selected template in the My Templates list. Saved Pattern Data
                        are written to your browser's cookies. When you delete cookies in your browser, your list
                        saved templates will also be deleted.</p>
                      : <p>Valitud malli saate salvestada loendisse Minu mallid. Salvestatud mustri andmed
                        kirjutatakse teie brauseri küpsistele. Kui kustutate brauseris küpsised, kuvatakse teie loend
                        kustutatakse ka salvestatud mallid.</p>}

                  <Form.Label>
                    {this.state.lang == 'ru' ? "Название шаблона*" : this.state.lang == 'en' ? 'Template name*' : 'Malli nimi*'}
                  </Form.Label>
                  <Form.Control as="input"
                                type="text"
                                value={this.state.patternName}
                                onChange={(e) => {
                                  this.setState({
                                    patternName: e.target.value
                                  })
                                }}

                  >
                  </Form.Control>
                  <Button
                    disabled={this.state.patternName.length ? false : true}
                    className="roundBtn saveBtn"
                    onClick={() => {
                      let documendibass_savedTemplates = window.localStorage.getItem('documendibass_savedTemplates');
                      if (!documendibass_savedTemplates) {
                        documendibass_savedTemplates = [];
                      } else {
                        documendibass_savedTemplates = JSON.parse(documendibass_savedTemplates);
                      }
                      let newTemplate = {
                        title: this.state.patternName,
                        slug: this.state.data[0].slug,
                        nid: Date.now(),
                        defaultValues: this.state.visFields,
                        lang: this.state.lang
                      }

                      if (this.props.saved) {
                        if (this.state.originalPatternName == this.state.patternName) {
                          documendibass_savedTemplates.forEach(tmp => {
                            if (tmp.nid == this.props.saved) {
                              tmp.defaultValues = this.state.visFields;
                            }
                          })
                        } else {
                          documendibass_savedTemplates.push(newTemplate);
                        }
                      } else {
                        documendibass_savedTemplates.push(newTemplate);
                      }

                      window.localStorage.setItem('documendibass_savedTemplates', JSON.stringify(documendibass_savedTemplates));

                      this.setState({showModalSaveTemplate: false})
                    }}
                  >
                    {this.state.lang == 'ru' ? "Сохранить" : this.state.lang == 'en' ? 'Save' : 'Salvesta'}
                  </Button>

                </Modal.Body>
              </Modal></>
          }
        </Layout>
      );
    }

  }
}


DocumentPage.getInitialProps = async (props) => {
  let lang = cookies(props).lang || props.store.getState().lang;

  let documentSlug = props.query.document;
  // Fetch data from external API
  const res = await fetch(`http://sandbox.webbro.pro/api/all_docs?slug=${documentSlug}&lang=${lang}`)
  const data = await res.json()
  let schema = data[0].schema;
  const objSchema = JSON.parse(schema);

  return {
    data: data,
    objSchema: objSchema,
    slug: documentSlug,
    language: lang,
    saved: props.query.saved ? props.query.saved : false
  }
}

const mapStateToProps = state => ({
  lang: state.lang
});

const mapDispatchToProps = {
  setLang: setLang
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentPage);
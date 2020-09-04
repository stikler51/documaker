import React from "react";
import Form from 'react-bootstrap/Form';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import * as yup from 'yup';
import Link from "next/link";
import Arrow from '../static/arrow.svg';
import Plus from '../static/plus.svg';
import styles from '../styles/form.module.scss';
import InputGroup from "react-bootstrap/InputGroup";
import CloseIcon from "../static/close.svg";
import cookies from "next-cookies";

class DocForm extends React.Component {
  constructor(props) {
    super(props);
    let validation = {};
    this.state = {};

    // объект в котором хранятся все айди зависимых полей
    let depends = {
      all: []
    };
    // массив для хранения айди полей с несколькими значениями
    let multi = [];
    // массив для хранения айди видимых полей
    let visible = {};

    // Находим айди всех зависимых полей, чтобы сделать их невидимыми
    props.schema.fieldBlocks.map((block) => {
      block.fields.map((field) => {
        let fieldD = [];

        let validationSchema = yup;

        // если айди нет, значит это пустой объект, нам не нужен
        if (field.id && field.multipleValues) {
          visible[field.id] = [];
        } else {
          visible[field.id] = field.defaultValue || '';
        }

        if (field.type === 'number') {
          if (field.required) {
            validationSchema = validationSchema.number().typeError('Допустимы только числа').required('Это поле обязательно для заполнения');
          } else {
            validationSchema = validationSchema.number().typeError('Допустимы только числа');
          }

        }

        if (field.type === 'text' || field.type === 'list' || field.type === 'radio') {
          if (field.required) {
            validationSchema = validationSchema.string().required('Это поле обязательно для заполнения');
          } else {
            validationSchema = validationSchema.string();
          }
        }

        if (field.type === 'checkbox') {
          if (field.required) {
            validationSchema = validationSchema.boolean().oneOf([true], 'Это поле обязательно для заполнения');
          }
        }

        if (field.type === 'email') {
          if (field.required) {
            validationSchema = validationSchema.string().email('Неправильный формат email').required('Это поле обязательно для заполнения');
          } else {
            validationSchema = validationSchema.string().email('Неправильный формат email');
          }
        }

        if (field.defaultValue) {
          this.state[field.id] = field.defaultValue
        }

        // если есть зависимости, добавляем их
        if (field.dependencies) {
          depends.all = [...depends.all, ...field.dependencies];
        }

        // если есть флаг поля с несколькими значениями, сохраняем
        if (field.multipleValues) {
          multi[field.id] = [0];
        }

        // проверяем на наличие зависимостей поля с вариантами выбора
        if (field.options) {
          field.options.map(opt => {
            if (opt.dependencies) {
              depends.all = [...depends.all, ...opt.dependencies];
              fieldD = [...fieldD, ...opt.dependencies];
            }
          })
        }

        if (fieldD.length) {
          depends[field.id] = fieldD
        }

        if (!validationSchema.__esModule) {
          validation[field.id] = validationSchema;
        }

      });
    });

    // если нашелся скрытый целый блок, то все поля из этого блока удаляем из видимых
    props.schema.fieldBlocks.map(block => {
      if (depends.all.includes(block.id)) {
        block.fields.map(field => {
          delete visible[field.id]
        })
      }
    })

    // оставляем только те поля, которые не скрыты
    const filtered = Object.keys(visible)
      .filter(key => !depends.all.includes(key))
      .reduce((obj, key) => {
        obj[key] = visible[key];
        return obj;
      }, {});

    let lang = cookies(props).lang || props.store.getState().lang;

    this.state.dependedFields = depends;
    this.state.multiple = multi;
    this.state.visibleFields = filtered;
    this.state.validationSchema = validation;
    this.state.errors = {};
    this.state.isMobile = false;
    this.state.defVal = {};
    this.state.lang = lang;

    this.validationHandler = this.validationHandler.bind(this);
  }

  async componentDidMount() {
    if (this.props.saved) {
      let savedString = window.localStorage.getItem('documendibass_savedTemplates');
      let savedTemplates = JSON.parse(savedString);

      await savedTemplates.filter(t => {
        if (t.nid == this.props.saved) {
          // console.log('1', t.defaultValues);

          this.setState({
            visibleFields: t.defaultValues,
            ...t.defaultValues
          })
        }
      });
      // console.log(this.state.visibleFields);

      for (let field in this.state.visibleFields) {

        if (typeof this.state.visibleFields[field] === 'object') {
          let numOfValues = [];
          for (let key in this.state.visibleFields[field]) {
            numOfValues.push(key);
          }
          // let numOfValues = this.state.visibleFields[field].map((f, index) => {
          //   return index
          // });

          this.setState({
            multiple: {
              ...this.state.multiple,
              [field]: numOfValues
            }
          })
        }

        var event = new Event('change', {bubbles: true});
        let el = document.querySelectorAll(`#${field}`);
        if (!el.length) {
          el = document.querySelectorAll(`[name=${field}]`);
        }

        let radioIsAlreadySet = false;

        el.forEach(inp => {
          // восстановление значений радиобаттонов
          if (inp.getAttribute('type') === 'radio') {
            if (inp.value === this.state[field] && this.state[field].length) {
              radioIsAlreadySet = true;
              inp.setAttribute('checked', true);
              return 0;
            } else if (inp.value === '' && this.state[field].length && !radioIsAlreadySet) {
              // console.log(2, inp.value, this.state[field]);
              inp.setAttribute('checked', true);

              let dependedFields = inp.getAttribute('dependencies');
              if (dependedFields) {
                dependedFields = dependedFields.split(',');
                // Пробегаемся по полям данного варианта и делаем их видимыми
                dependedFields.map(id => {
                  let el = document.body.querySelector(`.${id}-hidden`);
                  if (el) {
                    el.removeAttribute('hidden');
                  }
                })
              }
            } else {
              inp.removeAttribute('checked');
            }
          } else if (inp.getAttribute('type') === 'checkbox') {

            if (inp.value === this.state[field]) {
              // inp.setAttribute('checked', true)
              inp.checked = true;

              let dependedFields = inp.getAttribute('dependencies');
              if (dependedFields) {
                dependedFields = dependedFields.split(',');
                // Пробегаемся по полям данного варианта и делаем их видимыми
                dependedFields.map(id => {
                  let el = document.body.querySelector(`.${id}-hidden`);
                  if (el) {
                    el.removeAttribute('hidden');
                  }
                })
              }

            } else {
              inp.checked = false;
            }
            // inp.dispatchEvent(event);

          } else {
            inp.dispatchEvent(event);
          }
        });

        //================================

      }


    }

    this.props.changeHandler(this.state.visibleFields);

    if (window.innerWidth < 768) {
      this.setState({
        isMobile: true
      })
    }
    ;

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


    // window.addEventListener('beforeunload', () => {
    //
    //   window.alert('AAAAAAA');
    //   // if (this.state.visibleFields) {
    //   //
    //   // }
    // });

    if (this.props.js.length) {
      let f = new Function(this.props.js);

      f();
    }


  }

  validationHandler(errors, id) {
    let a = this.state.errors;
    a[id] = errors;

    this.setState({
      errors: a
    });
  }

  render() {
    let schema = yup.object().shape(this.state.validationSchema);
    return <Form className="document-form">

      {/*Рендерим блоки*/}
      {this.props.schema.fieldBlocks.map((block, index) => {
        return <div id={block.id}
                    key={block.id}
                    hidden={this.state.dependedFields.all.indexOf(block.id) >= 0}
                    className={this.state.dependedFields.all.indexOf(block.id) >= 0 ? `${block.id}-hidden form-block` : 'form-block'}>
          {/*в самом первом блоке выводим название и описание документа*/}
          {index === 0 ? <Link href='/'>
            <a className={styles.backToMain}>
              <Arrow/>
              {this.state.lang == 'ru' ? "Выбрать другой документ" : this.state.lang == 'en' ? 'Select another document' : 'Valige teine ​​dokument'}
            </a>
          </Link> : ''}
          {index === 0 ? <h1 className="document-title">{this.props.title}</h1> : ''}
          {index === 0 ? <div className={styles.documentDescription}
                              dangerouslySetInnerHTML={{__html: this.props.body}}></div> : ''}
          {/*рендерим название и описание блока*/}
          {block.title.length ? <h3 className="form-block-title">{block.title}</h3> : ''}
          {block.description.length ? <div className={styles.documentDescription}
                                           dangerouslySetInnerHTML={{__html: block.description}}></div> : ''}
          {/*Итерируемся по полям блока*/}
          <Form.Row>
            {block.fields.map((field, index) => {
              let popover;
              let reqAttr = <span className="req-sign">*</span>;
              // получаем количество колонок (по умолчанию 1)
              let cols = block.cols || 1;

              //Создается компонент со всплывающей подсказкой
              {
                field.description ? popover = <Popover id={`${field.id}-popover`}>
                    <Popover.Content dangerouslySetInnerHTML={{__html: field.description}}>
                    </Popover.Content>
                  </Popover>
                  : ''
              }

              return <Col md={field.fullRow ? 12 : field.multipleValues ? 6 : 12 / cols}
                          key={field.id ? field.id : `${block.id}-${index}`}
                          hidden={this.state.dependedFields.all.indexOf(field.id) >= 0}
                          className={this.state.dependedFields.all.indexOf(field.id) >= 0 ? `${field.id}-hidden` : ''}>

                {/*Логика поведения полей с несколькими значениями*/}
                {field.multipleValues
                  ? <Form.Group controlId={field.id}>
                    {field.title && field.type !== 'checkbox' ? <Form.Label>
                        {field.title}
                        {field.description ?
                          <OverlayTrigger trigger={['hover', 'focus']} placement={this.state.isMobile ? 'left' : 'right'}
                                          overlay={popover}>
                            <svg aria-hidden="true" focusable="false" data-prefix="far"
                                 data-icon="question-circle"
                                 className="popover-btn svg-inline--fa fa-question-circle fa-w-16"
                                 role="img"
                                 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                              <path fill="currentColor"
                                    d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path>
                            </svg>
                          </OverlayTrigger>
                          : ''}
                      </Form.Label>
                      : ''}

                    {this.state.multiple[field.id].map(ind => {
                      let rIndex = this.state.multiple[field.id].indexOf(ind);
                      return <InputGroup key={`${field.id}-${rIndex}`}>
                        <Form.Control
                          as="input"
                          className="mb-3"
                          index={`${field.id}-${rIndex}`}
                          value={this.state[field.id] ? this.state[field.id][ind] : ''}
                          type={field.type}
                          placeholder={field.placeholder ? field.placeholder : ""}
                          onChange={(e) => {
                            let obj = this.state.visibleFields;
                            // obj[field.id][rIndex] = e.target.value;
                            obj[field.id] = {
                              ...obj[field.id],
                              [ind]: e.target.value
                            };

                            let arr = this.state[field.id] || {};
                            arr = {
                              ...arr,
                              [ind]: e.target.value
                            };

                            this.setState({
                              visibleFields: obj,
                              [field.id]: arr
                            });
                          }}
                          onBlur={(e) => {
                            console.log('visible', this.state.visibleFields);
                            this.props.changeHandler(this.state.visibleFields);
                          }}
                        />
                        <InputGroup.Append>
                          <Button
                            style={{
                              padding: '4px 12px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                            hidden={this.state.multiple[field.id].length > 1 ? false : true}
                            className="mb-3"
                            variant="outline-danger"
                            onClick={() => {
                              let visFields = this.state.visibleFields;
                              let arr = this.state[field.id];
                              let index = this.state.multiple[field.id];

                              // visFields[field.id].splice(rIndex, 1);
                              delete visFields[field.id][ind];
                              delete arr[ind];
                              let i = index.indexOf(ind);
                              index.splice(i, 1);

                              this.setState({
                                visibleFields: visFields,
                                [field.id]: arr,
                                multiple: {
                                  [field.id]: index
                                },
                              });

                              this.props.changeHandler(this.state.visibleFields);
                            }}
                          >
                            <CloseIcon/>
                          </Button>
                        </InputGroup.Append>
                      </InputGroup>
                    })}
                    <Button variant="outline-primary"
                            className="roundBtn plus"
                            onClick={() => {
                              // let numberOfInputs = this.state.multiple[field.id][this.state.multiple[field.id].length - 1];
                              let indx = this.state.multiple[field.id];

                              indx.push(Date.now());
                              this.setState({
                                multiple: {
                                  [field.id]: indx
                                },
                              })

                              console.log('multiple', this.state.multiple);
                            }}
                    ><Plus/></Button>
                  </Form.Group>

                  //Обычное текстовое поле
                  : <Form.Group controlId={field.id}>
                    {/*Рендерится название поля и всплывающая подсказка*/}
                    <Form.Label>
                      <div>
                        {field.title && field.type !== 'checkbox' ? `${field.title}` : ''}
                        {field.required && field.title && field.type !== 'checkbox' ? reqAttr : ''}
                      </div>
                      {field.description && field.type !== 'checkbox' ?
                        <OverlayTrigger trigger={['hover', 'focus']} placement={this.state.isMobile ? 'left' : 'right'}
                                        overlay={popover}>
                          <svg aria-hidden="true" focusable="false" data-prefix="far"
                               data-icon="question-circle"
                               className="popover-btn svg-inline--fa fa-question-circle fa-w-16"
                               role="img"
                               xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="currentColor"
                                  d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path>
                          </svg>
                        </OverlayTrigger>
                        : ''}
                    </Form.Label>


                    {field.type === 'text' || field.type === 'number' || field.type === 'email' || field.type === 'tel'
                      ? <div><Form.Control as="input"
                                           type="text"
                                           valuefor={field.valueFor || ''}
                                           placeholder={field.placeholder ? field.placeholder : ""}
                                           required={!!field.required}
                                           value={this.state[field.id] || this.state[field.valueFor] || ''}
                                           isInvalid={!!this.state.errors[field.id]}
                                           onChange={(e) => {
                                             this.setState({[field.id]: e.target.value})

                                             if (field.valueFor) {
                                               this.setState({
                                                 [field.valueFor]: e.target.value
                                               })
                                             }
                                           }}
                                           onBlur={async (e) => {
                                             e.persist();
                                             let obj = this.state.visibleFields;

                                             let errors = [];

                                             if (this.state.validationSchema[field.id]) {
                                               await schema.validateAt(field.id, {[field.id]: e.target.value}).catch(function (err) {
                                                 errors = err.errors;
                                               });
                                             }

                                             if (errors.length) {
                                               this.validationHandler(errors, field.id)
                                             } else {
                                               let allErrors = this.state.errors;
                                               delete allErrors[field.id];

                                               if (field.valueFor) {
                                                 obj[field.valueFor] = e.target.value;

                                                 await schema.validateAt(field.valueFor, {[field.valueFor]: e.target.value}).catch(function (err) {
                                                   errors = err.errors;
                                                 });

                                                 if (errors.length) {
                                                   this.validationHandler(errors, field.valueFor)
                                                 } else {
                                                   delete allErrors[field.valueFor];
                                                 }

                                                 this.setState({
                                                   visibleFields: obj,
                                                   [field.valueFor]: e.target.value,
                                                   [field.id]: e.target.value,
                                                   errors: allErrors
                                                 })
                                               } else {
                                                 obj[field.id] = e.target.value;
                                                 this.setState({
                                                   visibleFields: obj,
                                                   [field.id]: e.target.value,
                                                   errors: allErrors
                                                 })
                                               }
                                               this.props.changeHandler(this.state.visibleFields);
                                             }
                                           }}
                      /><Form.Control.Feedback
                        type="invalid">{this.state.errors[field.id] ? this.state.errors[field.id][0] : ''}</Form.Control.Feedback>
                      </div>
                      : field.type === 'list'
                        ? <div>
                          {/*{console.log(this.state[field.id])}*/}
                          <Form.Control
                            as="select"
                            placeholder={field.placeholder ? field.placeholder : ""}
                            required={!!field.required}
                            isInvalid={!!this.state.errors[field.id]}
                            // value={this.state[field.id]}
                            onChange={async (e) => {
                              // console.log(e.target.value)
                              e.persist();
                              let dependedFields = e.target.options[e.target.selectedIndex].getAttribute('dependencies');
                              let visObj = this.state.visibleFields;

                              let errors = [];

                              if (this.state.validationSchema[field.id]) {
                                await schema.validateAt(field.id, {[field.id]: e.target.value}).catch(function (err) {
                                  errors = err.errors;
                                });
                              }

                              if (errors.length) {
                                this.validationHandler(errors, field.id)
                              } else {
                                let allErrors = this.state.errors;
                                delete allErrors[field.id];

                                this.setState({
                                  errors: allErrors
                                })
                              }

                              if (dependedFields) {
                                dependedFields = dependedFields.split(',');

                                // Пробегаемся по всем зависимым от этого поля полям и делаем их невидимыми
                                this.state.dependedFields[field.id].map(id => {
                                  let el = document.body.querySelector(`.${id}-hidden`);
                                  if (el) {
                                    el.setAttribute('hidden', true);

                                    if (visObj[field.id]) {
                                      delete visObj[field.id];
                                    }

                                    if (el.classList.contains('form-block')) {
                                      this.props.schema.fieldBlocks.map(block => {
                                        if (block.id === id) {
                                          block.fields.map(field => {
                                            if (visObj[field.id]) {
                                              delete visObj[field.id]
                                            }
                                          })
                                        }
                                      })
                                    }
                                  }
                                })

                                // Пробегаемся по полям данного варианта и делаем их видимыми
                                dependedFields.map(id => {
                                  // console.log(id);
                                  let el = document.body.querySelector(`.${id}-hidden`);
                                  // console.log(el);
                                  if (el) {

                                    el.removeAttribute('hidden');

                                    if (!el.classList.contains('form-block')) {
                                      if (this.state.multiple[field.id]) {
                                        visObj[field.id] = this.state[field.id] || [];
                                      } else {
                                        visObj[field.id] = this.state[field.id] || '';
                                      }
                                      // visObj[field.id] = this.state[field.id] || '';
                                    } else {
                                      this.props.schema.fieldBlocks.map(block => {
                                        if (block.id === id) {
                                          block.fields.map(field => {
                                            if (field.id) {
                                              if (this.state.multiple[field.id]) {
                                                visObj[field.id] = this.state[field.id] || [];
                                              } else {
                                                visObj[field.id] = this.state[field.id] || '';
                                              }
                                              // visObj[field.id] = this.state[field.id] || '';
                                            }
                                          })
                                        }

                                      })
                                    }

                                  }
                                })

                              } else if (this.state.dependedFields[field.id]) {
                                this.state.dependedFields[field.id].map(id => {
                                  let el = document.body.querySelector(`.${id}-hidden`);
                                  if (el) {
                                    el.setAttribute('hidden', true);
                                    if (visObj[field.id]) {
                                      delete visObj[field.id];
                                    }

                                    if (el.classList.contains('form-block')) {
                                      this.props.schema.fieldBlocks.map(block => {
                                        if (block.id === id) {
                                          block.fields.map(field => {
                                            delete visObj[field.id]
                                          })
                                        }
                                      })
                                    }
                                  }
                                })
                              }

                              visObj[field.id] = e.target.value;

                              this.setState({
                                visibleFields: visObj,
                                [field.id]: e.target.value
                              })

                              this.props.changeHandler(this.state.visibleFields);
                            }}
                          >
                            <option value="" key="default-0">{field.placeholder}</option>
                            {field.options.map((opt, index) => {
                              return <option
                                selected={this.state[field.id] == opt.value}
                                value={opt.value}
                                key={`${field.id}-${index + 1}`}
                                dependencies={opt.dependencies}>{opt.title}</option>
                            })}
                          </Form.Control>
                          <Form.Control.Feedback
                            type="invalid">{this.state.errors[field.id] ? this.state.errors[field.id][0] : ''}</Form.Control.Feedback>
                        </div>
                        : field.type === 'radio'
                          ? field.options.map((opt, index) => {
                            // console.log(opt);
                            return <div key={`${field.id}-${index}`} className="radio-wrapper">
                              <Form.Check
                                type="radio"
                                id={`${field.id}-${index}`}
                                label={opt.title}
                                required={!!field.required}
                                value={opt.value}
                                name={field.id}
                                isInvalid={!!this.state.errors[field.id]}
                                dependencies={opt.dependencies}
                                feedback={index == field.options.length - 1 ? `${this.state.errors[field.id] || ''}` : ''}
                                onChange={async (e) => {
                                  e.persist();
                                  let dependedFields = e.target.getAttribute('dependencies');
                                  let visObj = this.state.visibleFields;

                                  let errors = [];

                                  if (this.state.validationSchema[field.id]) {
                                    await schema.validateAt(field.id, {[field.id]: e.target.value || this.state[opt.valueFrom]}).catch(function (err) {
                                      errors = err.errors;
                                    });
                                  }

                                  if (errors.length) {
                                    this.validationHandler(errors, field.id)
                                  } else {
                                    let allErrors = this.state.errors;
                                    delete allErrors[field.id];

                                    this.setState({
                                      errors: allErrors
                                    })
                                  }

                                  if (dependedFields) {
                                    dependedFields = dependedFields.split(',');

                                    this.state.dependedFields[field.id].map(id => {
                                      let el = document.body.querySelector(`.${id}-hidden`);
                                      if (el) {
                                        el.setAttribute('hidden', true);

                                        if (visObj[field.id]) {
                                          delete visObj[field.id];
                                        }

                                        if (el.classList.contains('form-block')) {
                                          this.props.schema.fieldBlocks.map(block => {
                                            if (block.id === id) {
                                              block.fields.map(field => {
                                                if (visObj[field.id]) {
                                                  delete visObj[field.id]
                                                }
                                              })
                                            }
                                          })
                                        }
                                      }
                                    })

                                    dependedFields.map(id => {
                                      let el = document.body.querySelector(`.${id}-hidden`);
                                      if (el) {
                                        el.removeAttribute('hidden');

                                        if (!el.classList.contains('form-block')) {
                                          if (this.state.multiple[field.id]) {
                                            visObj[field.id] = this.state[field.id] || [];
                                          } else {
                                            visObj[field.id] = this.state[field.id] || '';
                                          }
                                          // visObj[field.id] = this.state[field.id] || '';
                                        } else {
                                          this.props.schema.fieldBlocks.map(block => {
                                            if (block.id === id) {
                                              block.fields.map(field => {
                                                if (field.id) {
                                                  if (this.state.multiple[field.id]) {
                                                    visObj[field.id] = this.state[field.id] || [];
                                                  } else {
                                                    visObj[field.id] = this.state[field.id] || '';
                                                  }
                                                  // visObj[field.id] = this.state[field.id] || '';
                                                }
                                              })
                                            }
                                          })
                                        }
                                      }
                                    })

                                  } else if (this.state.dependedFields[field.id]) {
                                    this.state.dependedFields[field.id].map(id => {
                                      let el = document.body.querySelector(`.${id}-hidden`);
                                      if (el) {
                                        el.setAttribute('hidden', true);

                                        if (visObj[field.id]) {
                                          delete visObj[field.id];
                                        }

                                        if (el.classList.contains('form-block')) {
                                          this.props.schema.fieldBlocks.map(block => {
                                            if (block.id === id) {
                                              block.fields.map(field => {
                                                if (visObj[field.id]) {
                                                  delete visObj[field.id]
                                                }
                                              })
                                            }
                                          })
                                        }
                                      }
                                    })
                                  }

                                  if (opt.valueFrom) {
                                    visObj[field.id] = this.state[opt.valueFrom] || '';
                                    this.setState({
                                      visibleFields: visObj,
                                      [field.id]: this.state[opt.valueFrom] || ''
                                    })
                                  } else {
                                    visObj[field.id] = e.target.value;
                                    this.setState({
                                      visibleFields: visObj,
                                      [field.id]: e.target.value
                                    })
                                  }

                                  this.props.changeHandler(this.state.visibleFields);
                                }}
                              />
                              {opt.description ?
                                <OverlayTrigger trigger={['hover', 'focus']}
                                                placement={this.state.isMobile ? 'left' : 'right'}
                                                overlay={<Popover id={`${field.id}-popover-${index}`}>
                                                  <Popover.Content dangerouslySetInnerHTML={{__html: opt.description}}>
                                                  </Popover.Content>
                                                </Popover>}>


                                  <svg aria-hidden="true" focusable="false" data-prefix="far"
                                       data-icon="question-circle"
                                       className="popover-btn svg-inline--fa fa-question-circle fa-w-16"
                                       role="img"
                                       xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path fill="currentColor"
                                          d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path>
                                  </svg>
                                </OverlayTrigger>
                                : ''}
                            </div>
                          })
                          : field.type === 'checkbox'
                            ? <div className="radio-wrapper">
                              <Form.Check
                                type="checkbox"
                                id={field.id}
                                label={<p>{field.title}<span className="req-sign">*</span></p>}
                                value={field.value}
                                // checked={field.value == this.state[field.id]}
                                required={!!field.required}
                                isInvalid={!!this.state.errors[field.id]}
                                dependencies={field.dependencies}
                                feedback={this.state.errors[field.id] || ''}
                                onChange={async (e) => {
                                  e.persist();
                                  let dependedFields = e.target.getAttribute('dependencies');
                                  let visObj = this.state.visibleFields;

                                  let errors = [];

                                  if (this.state.validationSchema[field.id]) {
                                    await schema.validateAt(field.id, {[field.id]: e.target.checked}).catch(function (err) {
                                      errors = err.errors;
                                    });
                                  }

                                  if (errors.length) {
                                    this.validationHandler(errors, field.id)
                                  } else {
                                    let allErrors = this.state.errors;
                                    delete allErrors[field.id];

                                    this.setState({
                                      errors: allErrors
                                    })
                                  }


                                  if (e.target.checked) {
                                    if (dependedFields) {
                                      dependedFields = dependedFields.split(',');
                                      dependedFields.map(id => {
                                        let el = document.body.querySelector(`.${id}-hidden`);
                                        if (el) {
                                          el.removeAttribute('hidden');

                                          if (!el.classList.contains('form-block')) {
                                            if (this.state.multiple[field.id]) {
                                              visObj[field.id] = this.state[field.id] || [];
                                            } else {
                                              visObj[field.id] = this.state[field.id] || '';
                                            }
                                            // visObj[field.id] = this.state[field.id] || '';
                                          } else {
                                            this.props.schema.fieldBlocks.map(block => {
                                              if (block.id === id) {
                                                block.fields.map(field => {
                                                  if (field.id) {
                                                    if (this.state.multiple[field.id]) {
                                                      visObj[field.id] = this.state[field.id] || [];
                                                    } else {
                                                      visObj[field.id] = this.state[field.id] || '';
                                                    }
                                                    // visObj[field.id] = this.state[field.id] || '';
                                                  }
                                                })
                                              }

                                            })
                                          }
                                        }
                                      })
                                    }

                                    visObj[field.id] = e.target.value;
                                    this.setState({
                                      visibleFields: visObj,
                                      [field.id]: e.target.value
                                    })

                                    this.props.changeHandler(this.state.visibleFields);

                                  } else {

                                    if (dependedFields) {
                                      dependedFields = dependedFields.split(',');
                                      dependedFields.map(id => {
                                        let el = document.body.querySelector(`.${id}-hidden`);
                                        if (el) {
                                          el.setAttribute('hidden', true);

                                          if (visObj[field.id]) {
                                            delete visObj[field.id];
                                          }

                                          if (el.classList.contains('form-block')) {
                                            this.props.schema.fieldBlocks.map(block => {
                                              if (block.id === id) {
                                                block.fields.map(field => {
                                                  if (visObj[field.id]) {
                                                    delete visObj[field.id]
                                                  }
                                                })
                                              }
                                            })
                                          }
                                        }
                                      })
                                    }

                                    visObj[field.id] = field.defaultValue || '';
                                    this.setState({
                                      visibleFields: visObj,
                                      [field.id]: field.defaultValue || ''
                                    })

                                    this.props.changeHandler(this.state.visibleFields);
                                  }
                                }}
                              />
                              {field.description ?
                                <OverlayTrigger trigger={['hover', 'focus']}
                                                placement={this.state.isMobile ? 'left' : 'right'}
                                                overlay={<Popover id={`${field.id}-popover-${index}`}>
                                                  <Popover.Content
                                                    dangerouslySetInnerHTML={{__html: field.description}}>
                                                  </Popover.Content>
                                                </Popover>}>


                                  <svg aria-hidden="true" focusable="false" data-prefix="far"
                                       data-icon="question-circle"
                                       className="popover-btn svg-inline--fa fa-question-circle fa-w-16"
                                       role="img"
                                       xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path fill="currentColor"
                                          d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 448c-110.532 0-200-89.431-200-200 0-110.495 89.472-200 200-200 110.491 0 200 89.471 200 200 0 110.53-89.431 200-200 200zm107.244-255.2c0 67.052-72.421 68.084-72.421 92.863V300c0 6.627-5.373 12-12 12h-45.647c-6.627 0-12-5.373-12-12v-8.659c0-35.745 27.1-50.034 47.579-61.516 17.561-9.845 28.324-16.541 28.324-29.579 0-17.246-21.999-28.693-39.784-28.693-23.189 0-33.894 10.977-48.942 29.969-4.057 5.12-11.46 6.071-16.666 2.124l-27.824-21.098c-5.107-3.872-6.251-11.066-2.644-16.363C184.846 131.491 214.94 112 261.794 112c49.071 0 101.45 38.304 101.45 88.8zM298 368c0 23.159-18.841 42-42 42s-42-18.841-42-42 18.841-42 42-42 42 18.841 42 42z"></path>
                                  </svg>
                                </OverlayTrigger>
                                : ''}
                            </div>
                            : ''
                    }
                  </Form.Group>
                }
              </Col>;
            })}
          </Form.Row>
        </div>
      })}
      {/*<Button type="submit" onClick={(e) => {*/}
      {/*  e.preventDefault();*/}
      {/*  console.log(this.state)*/}
      {/*  schema.isValid(this.state.visibleFields).then(function (valid) {*/}
      {/*    console.log(valid);*/}
      {/*  });*/}
      {/*}}*/}
      {/*>Click</Button>*/}
    </Form>
  }

}

export default DocForm;